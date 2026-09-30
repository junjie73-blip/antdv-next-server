import cron, { type ScheduledTask } from "node-cron";
import { logger } from "@/platform/logger/index.js";
import { withLock, withPgLock } from "@/core/lock/index.js";
import { collectLogTableSizes } from "@/platform/metrics/index.js";
import {
  maintainPartitions,
  archiveExpiredPartitions,
  aggregateDaily,
} from "./maintenance/index.js";
import { CancelAccountService } from "@/modules/auth/service/cancel-account.service.js";
import { EmailVerifyService } from "@/modules/auth/index.js";
import { runFileCleanupTask } from "./tasks/file-cleanup.task.js";
const LOCK_KEY = "job:lock:cancel-account-clean";
const LOCK_TTL = 10 * 60; // 10 分钟
const VERIFY_CODE_LOCK_KEY = "job:lock:verify-code-clean";
const VERIFY_CODE_LOCK_TTL = 5 * 60;
const tasks: ScheduledTask[] = [];

/**
 * 启动所有后台 cron 任务
 * - 多实例部署时用 pg advisory lock 保证只有一个实例执行
 * - 返回 task 列表供优雅退出时停止
 */
export function startScheduler(): ScheduledTask[] {
  // ① 凌晨 2 点：分区维护（预建 + 归档过期）
  tasks.push(
    cron.schedule("0 2 * * *", async () => {
      try {
        const done = await withPgLock(async () => {
          await maintainPartitions();
          await archiveExpiredPartitions();
        });
        if (done === null) {
          logger.info(
            "[cron] partition maintenance skipped (another instance)",
          );
        }
      } catch (err) {
        logger.error({ err }, "[cron] partition maintenance failed");
      }
    }),
  );

  // ② 凌晨 3 点：聚合前一天审计日志
  tasks.push(
    cron.schedule("0 3 * * *", async () => {
      try {
        await aggregateDaily(new Date(Date.now() - 86_400_000));
      } catch (err) {
        logger.error({ err }, "[cron] daily aggregation failed");
      }
    }),
  );

  // ③ 每 10 分钟：采集日志表大小指标
  tasks.push(
    cron.schedule("*/10 * * * *", async () => {
      try {
        await collectLogTableSizes();
      } catch (err) {
        logger.error({ err }, "[cron] log table size collection failed");
      }
    }),
  );
  // 注销申请清理：改到 3:30，避开 3:00 的聚合任务
  tasks.push(
    cron.schedule(
      "30 3 * * *",
      async () => {
        try {
          const result = await withLock(LOCK_KEY, LOCK_TTL, async () => {
            const service = new CancelAccountService();
            return await service.cleanExpired();
          });
          if (result === null) {
            logger.debug("[job] cancel-account-clean skipped, lock held");
          }
        } catch (err) {
          logger.error({ err }, "[cron] cancel-account-clean failed");
        }
      },
      { timezone: "Asia/Shanghai" },
    ),
  );
  // ⑤  每小时清理一次过期验证码
  tasks.push(
    cron.schedule("0 * * * *", async () => {
      const result = await withLock(
        VERIFY_CODE_LOCK_KEY,
        VERIFY_CODE_LOCK_TTL,
        async () => {
          const service = new EmailVerifyService();
          return await service.cleanExpiredCodes();
        },
      );

      if (result !== null && result > 0) {
        logger.info({ count: result }, "[job] expired verify codes cleaned");
      }
    }),
  );
  tasks.push(
    cron.schedule("*/10 * * * *", async () => {
      await withPgLock(async () => {
        await runFileCleanupTask();
      });
    }),
  );
  logger.info({ count: tasks.length }, "[cron] scheduler started");
  return tasks;
}

export function stopScheduler(): void {
  for (const t of tasks) {
    try {
      t.stop();
    } catch {}
  }
  tasks.length = 0;
  logger.info("[cron] scheduler stopped");
}
