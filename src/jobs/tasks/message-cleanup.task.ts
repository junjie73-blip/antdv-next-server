import { MessageRepository } from "@/modules/message/repository.js";
import { logger } from "@/platform/logger/index.js";

const repo = new MessageRepository();

/**
 * 清理过期/软删消息
 * 每天 3:30 执行
 */
export async function runMessageCleanupTask(): Promise<void> {
  const before = new Date(Date.now() - 30 * 86400 * 1000); // 软删 30 天后物理删除
  let total = 0;
  for (let i = 0; i < 20; i++) {
    const n = await repo.purgeExpired(before, 1000);
    total += n;
    if (n === 0) break;
  }
  if (total > 0) logger.info({ total }, "[message] cleanup done");
}
