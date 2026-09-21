import cron, { type ScheduledTask } from "node-cron";
import { logger } from "@/platform/logger/index.js";
import { withPgLock } from "@/core/lock/index.js";
import { collectLogTableSizes } from "@/platform/metrics/index.js";
import {
  maintainPartitions,
  archiveExpiredPartitions,
  aggregateDaily,
} from "./maintenance/index.js";

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
