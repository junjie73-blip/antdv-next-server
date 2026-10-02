import { logger } from "@/platform/logger/index.js";
import { SlowQueryRepository } from "@/modules/monitor/slow-query/index.js";
import { DEFAULT_RETENTION_DAYS } from "@/modules/monitor/slow-query/constants.js";

const repo = new SlowQueryRepository();

/**
 * 清理 N 天前已 review 的慢查询记录
 */
export async function runSlowQueryCleanupTask(): Promise<string> {
  const before = new Date(Date.now() - DEFAULT_RETENTION_DAYS * 86400 * 1000);
  let total = 0;
  for (let i = 0; i < 10; i++) {
    const n = await repo.purgeOld(before, 5000);
    total += n;
    if (n < 5000) break;
  }
  logger.info({ total, before }, "[slow-query] cleanup done");
  return `清理 ${total} 条`;
}
