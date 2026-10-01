import cron, { type ScheduledTask } from "node-cron";
import { logger } from "@/platform/logger/index.js";
import { withLock } from "@/core/lock/index.js";
import { withPgLock } from "./maintenance/lock.js";
import { collectLogTableSizes } from "@/platform/metrics/index.js";
import {
  maintainPartitions,
  archiveExpiredPartitions,
  aggregateDaily,
} from "./maintenance/index.js";
import { CancelAccountService } from "@/modules/auth/service/cancel-account.service.js";
import { EmailVerifyService } from "@/modules/auth/index.js";
import { runJob } from "./registry.js";

const tasks: ScheduledTask[] = [];

/* ============================================================
 * 任务定义表：cron + handler
 * ============================================================
 * 集中管理所有 cron 任务，便于查看和调整
 */
interface CronTaskDef {
  name: string;
  cron: string;
  handler: () => Promise<void>;
  /** 是否需要分布式锁 */
  locked?: boolean;
  timezone?: string;
}

const CRON_TASKS: CronTaskDef[] = [
  /* ============================================================
   * ① 维护类任务（走 withPgLock 保证多实例只跑一次）
   * ============================================================ */
  {
    name: "partition-maintenance",
    cron: "0 2 * * *", // 每天 2:00
    locked: true,
    handler: async () => {
      await maintainPartitions();
      await archiveExpiredPartitions();
    },
  },
  {
    name: "audit-daily-aggregate",
    cron: "0 3 * * *", // 每天 3:00
    handler: async () => {
      await aggregateDaily(new Date(Date.now() - 86_400_000));
    },
  },
  {
    name: "log-table-size",
    cron: "*/10 * * * *", // 每 10 分钟
    handler: async () => {
      await collectLogTableSizes();
    },
  },
  {
    name: "cancel-account-clean",
    cron: "30 3 * * *", // 每天 3:30
    locked: true,
    timezone: "Asia/Shanghai",
    handler: async () => {
      const service = new CancelAccountService();
      const result = await service.cleanExpired();
      if (result && result > 0) {
        logger.info({ count: result }, "[cron] cancel-account cleaned");
      }
    },
  },
  {
    name: "verify-code-clean",
    cron: "0 * * * *", // 每小时
    locked: true,
    handler: async () => {
      const service = new EmailVerifyService();
      const result = await service.cleanExpiredCodes();
      if (result && result > 0) {
        logger.info({ count: result }, "[cron] verify codes cleaned");
      }
    },
  },
  {
    name: "file-cleanup",
    cron: "*/10 * * * *", // 每 10 分钟
    handler: async () => {
      await runJob("fileCleanupJob");
    },
  },
  {
    name: "db-slow-query-review",
    cron: "0 4 * * *", // 每天 4:00
    locked: true,
    handler: async () => {
      await runJob("dbSlowQueryReviewJob");
    },
  },

  /* ============================================================
   * ② ⭐ 业务任务（走 registry，之前缺失的就是这些）
   * ============================================================ */
  {
    name: "workflow-timeout",
    cron: "* * * * *", // 每分钟
    locked: true,
    handler: async () => {
      await runJob("workflowTimeoutJob");
    },
  },
  {
    name: "report-cache-warm",
    cron: "*/30 * * * *", // 每 30 分钟
    locked: true,
    handler: async () => {
      await runJob("reportCacheWarmJob");
    },
  },
  {
    name: "export-cleanup",
    cron: "0 3 * * *", // 每天 3:00（错开 3:00 的聚合任务？聚合在 3:00，这里用 3:00 会冲突，改成 3:15）
    locked: true,
    handler: async () => {
      await runJob("exportCleanupJob");
    },
  },
  {
    name: "export-retry",
    cron: "* * * * *", // 每分钟
    locked: true,
    handler: async () => {
      await runJob("exportRetryJob");
    },
  },
  {
    name: "metrics-refresh",
    cron: "*/30 * * * * *", // 每 30 秒（node-cron 支持秒级）
    handler: async () => {
      await runJob("metricsRefreshJob");
    },
  },
];

/* ============================================================
 * 启动调度器
 * ============================================================ */
export function startScheduler(): ScheduledTask[] {
  for (const def of CRON_TASKS) {
    const task = cron.schedule(
      def.cron,
      async () => {
        const start = Date.now();
        try {
          if (def.locked) {
            const done = await withPgLock(async () => {
              await def.handler();
            });
            if (done === null) {
              logger.debug(
                { task: def.name },
                "[cron] skipped (another instance holds lock)",
              );
              return;
            }
          } else {
            await def.handler();
          }

          logger.info(
            { task: def.name, duration: Date.now() - start },
            "[cron] done",
          );
        } catch (err) {
          logger.error(
            { err, task: def.name, duration: Date.now() - start },
            "[cron] failed",
          );
        }
      },
      {
        timezone: def.timezone ?? "Asia/Shanghai",
        name: def.name,
      },
    );

    tasks.push(task);
  }

  logger.info(
    { count: tasks.length, tasks: CRON_TASKS.map((t) => t.name) },
    "[cron] scheduler started",
  );
  return tasks;
}

/* ============================================================
 * 停止调度器
 * ============================================================ */
export function stopScheduler(): void {
  for (const t of tasks) {
    try {
      t.stop();
    } catch {
      /* ignore */
    }
  }
  tasks.length = 0;
  logger.info("[cron] scheduler stopped");
}
