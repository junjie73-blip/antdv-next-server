import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";
import { exportQueue } from "@/platform/queue/queues.js";

const BATCH_SIZE = 100;

/**
 * 扫描到期需重试的导出任务
 * - 每 1 分钟执行
 * - status=pending 且 next_retry_at <= now
 * - 重新入队
 */
export async function exportRetryTask(): Promise<void> {
  const now = new Date();

  const tasks = await prisma.rp_export_task.findMany({
    where: {
      status: "pending",
      next_retry_at: { lte: now },
      retry_count: { lt: 999 }, // 防止极端情况
    },
    take: BATCH_SIZE,
    orderBy: { next_retry_at: "asc" },
  });

  if (tasks.length === 0) return;

  logger.info({ count: tasks.length }, "[export-retry] 发现待重试任务");

  let requeued = 0;

  for (const task of tasks) {
    try {
      const paramsData = task.params as any;

      // 重新入队
      await exportQueue.add(
        "export",
        {
          taskId: task.task_id,
          tenantId: task.tenant_id,
          userId: task.user_id,
          reportCode: task.report_code,
          exportType: task.export_type,
          input: paramsData?.input ?? {},
          filename: paramsData?.filename,
        },
        {
          jobId: `export-${task.task_id}-retry-${task.retry_count}-${Date.now()}`,
          attempts: 1, // 不再用 BullMQ 重试
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      );

      // 清空 next_retry_at，避免重复入队
      await prisma.rp_export_task.update({
        where: { task_id: task.task_id },
        data: { next_retry_at: null },
      });

      requeued++;
    } catch (err: any) {
      logger.error(
        { err, taskId: task.task_id },
        "[export-retry] 重新入队失败",
      );
    }
  }

  logger.info({ total: tasks.length, requeued }, "[export-retry] 完成");
}
