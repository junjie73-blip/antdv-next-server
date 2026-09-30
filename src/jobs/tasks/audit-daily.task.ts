import { AuditDailyService } from "@/modules/monitor/audit-daily/service.js";
import { logger } from "@/platform/logger/index.js";

/**
 * invoke_target: audit:daily
 * 每天凌晨 1 点聚合昨天的审计数据
 */
export async function runAuditDailyTask(): Promise<string> {
  const service = new AuditDailyService();

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const result = await service.aggregateDate(yesterday);
  logger.info(result, "[task] audit:daily done");

  return `聚合完成：审计 ${result.auditOps} 条操作，登录 ${result.loginRows} 条记录`;
}
