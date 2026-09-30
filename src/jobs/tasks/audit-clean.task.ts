import { AuditDailyService } from "@/modules/monitor/audit-daily/service.js";
import { logger } from "@/platform/logger/index.js";

/**
 * invoke_target: audit:clean-daily
 * 每月 1 号凌晨 2 点清理 2 年前的聚合数据
 */
export async function runAuditCleanTask(): Promise<string> {
  const service = new AuditDailyService();
  const result = await service.cleanExpiredAllTenants();
  logger.info(result, "[task] audit:clean-daily done");
  return `已清理审计 ${result.audit} 条、登录 ${result.login} 条`;
}
