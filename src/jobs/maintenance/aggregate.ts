import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";

/**
 * 聚合前一天审计日志到 sys_audit_daily
 * - 由 scheduler 在每天 3 点触发
 * - ON CONFLICT 幂等
 */
export async function aggregateDaily(date: Date): Promise<void> {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const next = new Date(d.getTime() + 86_400_000);

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO sys_audit_daily (id, tenant_id, stat_date, operation, total_count, fail_count, avg_time_ms)
    SELECT gen_random_uuid(), tenant_id, $1::date, operation,
           COUNT(*),
           COUNT(*) FILTER (WHERE status = '0'),
           COALESCE(AVG(execute_time)::int, 0)
      FROM sys_audit_log
     WHERE created_at >= $1 AND created_at < $2
     GROUP BY tenant_id, operation
    ON CONFLICT (tenant_id, stat_date, operation) DO UPDATE
      SET total_count = EXCLUDED.total_count,
          fail_count  = EXCLUDED.fail_count,
          avg_time_ms = EXCLUDED.avg_time_ms
  `,
    d,
    next,
  );

  logger.info({ date: d.toISOString().slice(0, 10) }, "[aggregate] daily done");
}
