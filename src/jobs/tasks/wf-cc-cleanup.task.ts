import { logger } from "@/platform/logger/index.js";
import { CcRepository } from "@/modules/workflow/repository/cc.repository.js";

const repo = new CcRepository();

/**
 * 清理 180 天前的抄送记录
 * 每天 4:30 执行
 */
export async function runWfCcCleanupTask(): Promise<void> {
  const before = new Date(Date.now() - 180 * 86400 * 1000);
  let total = 0;
  for (let i = 0; i < 50; i++) {
    const n = await repo.purgeBefore(before, 1000);
    total += n;
    if (n === 0) break;
  }
  if (total > 0) logger.info({ total }, "[wf-cc] cleanup done");
}
