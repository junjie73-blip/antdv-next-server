import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";
import { deleteFileByUrl } from "@/platform/storage/index.js";

const BATCH_SIZE = 200;

/**
 * 清理过期导出文件
 * - 每天凌晨 3 点执行
 * - 删除 expires_at <= now 的已完成任务文件
 * - 标记任务为 cancelled
 */
export async function cleanupExpiredExports(): Promise<void> {
  const start = Date.now();
  const now = new Date();

  const expired = await prisma.rp_export_task.findMany({
    where: {
      status: "completed",
      expires_at: { lte: now },
    },
    take: BATCH_SIZE,
    orderBy: { expires_at: "asc" },
    select: {
      task_id: true,
      file_url: true,
      tenant_id: true,
      file_name: true,
    },
  });

  if (expired.length === 0) {
    logger.debug("[rp-cleanup] 无过期导出文件");
    return;
  }

  logger.info({ count: expired.length }, "[rp-cleanup] 开始清理过期文件");

  let success = 0;
  let failed = 0;

  for (const task of expired) {
    try {
      // 1. 删除对象存储文件
      if (task.file_url) {
        await deleteFileByUrl(task.tenant_id, task.file_url).catch((err) => {
          logger.warn(
            { err, taskId: task.task_id },
            "[rp-cleanup] 删除文件失败（忽略，继续标记）",
          );
        });
      }

      // 2. 标记任务为已取消
      await prisma.rp_export_task.update({
        where: { task_id: task.task_id },
        data: {
          status: "cancelled",
          file_url: null,
          file_size: null,
        },
      });

      success++;
    } catch (err: any) {
      failed++;
      logger.error({ err, taskId: task.task_id }, "[rp-cleanup] 清理失败");
    }
  }

  logger.info(
    {
      total: expired.length,
      success,
      failed,
      duration: Date.now() - start,
    },
    "[rp-cleanup] 清理完成",
  );
}

/** 兼容别名（防止引用错名） */
export const reportExportCleanupTask = cleanupExpiredExports;
