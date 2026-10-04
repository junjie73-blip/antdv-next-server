import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";

const STUCK_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * 清理卡死的合并任务
 * - status = merging 且 updated_at < now - 30min
 * - 改为 failed，避免前端永远卡住
 */
export async function cleanupStuckUploadTasks() {
  const cutoff = new Date(Date.now() - STUCK_TIMEOUT_MS);

  const result = await prisma.sys_upload_task.updateMany({
    where: {
      status: { in: ["merging", "uploading"] },
      updated_at: { lt: cutoff },
    },
    data: {
      status: "failed",
      error_msg: "任务超时（>30 分钟未完成），已自动标记为失败",
    },
  });

  if (result.count > 0) {
    logger.warn({ count: result.count, cutoff }, "[upload] cleaned stuck tasks");
  }
}
