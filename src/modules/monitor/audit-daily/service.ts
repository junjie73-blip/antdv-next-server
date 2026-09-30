import { prisma } from "@/config/database.js";
import { Prisma } from "@/generated/prisma/client.js";
import { logger } from "@/platform/logger/index.js";
import { AppError } from "@/core/errors.js";
import type { DailyQueryDTO } from "./schema.js";

export interface AuditDailyRow {
  statDate: string;
  operation: string;
  totalCount: number;
  failCount: number;
  avgTimeMs: number;
  p95TimeMs: number;
}

export interface LoginDailyRow {
  statDate: string;
  totalCount: number;
  failCount: number;
  uniqueUsers: number;
}

export interface DailyOverview {
  totalRequests: number;
  totalFailures: number;
  successRate: number;
  avgTimeMs: number;
  p95TimeMs: number;
  totalLogins: number;
  loginFailures: number;
  uniqueUsers: number;
}

export class AuditDailyService {
  /* ============================================================
   * ⭐ 聚合指定日期（默认昨天）
   * ============================================================ */
  async aggregateDate(
    date: string,
    tenantId?: string,
  ): Promise<{
    date: string;
    auditOps: number;
    loginRows: number;
  }> {
    // 1. 校验日期
    const target = new Date(date);
    if (isNaN(target.getTime())) {
      throw new AppError("无效的日期", 400001, 400);
    }
    const dateStr = target.toISOString().slice(0, 10);

    logger.info(
      { date: dateStr, tenantId: tenantId ?? "ALL" },
      "[audit-daily] aggregate started",
    );

    // ============================================================
    // ⭐ 审计日志聚合（按 operation 分组）
    // ============================================================
    const auditOps = await prisma.$executeRaw`
      INSERT INTO sys_audit_daily (
        id, tenant_id, stat_date, operation,
        total_count, fail_count, avg_time_ms, p95_time_ms
      )
      SELECT
        gen_random_uuid(),
        tenant_id,
        ${dateStr}::date AS stat_date,
        operation,
        COUNT(*)::int AS total_count,
        COUNT(*) FILTER (WHERE status = '0')::int AS fail_count,
        COALESCE(AVG(execute_time), 0)::int AS avg_time_ms,
        COALESCE(
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execute_time),
          0
        )::int AS p95_time_ms
      FROM sys_audit_log
      WHERE created_at >= ${dateStr}::date
        AND created_at < ${dateStr}::date + INTERVAL '1 day'
        ${
          tenantId
            ? Prisma.sql`AND tenant_id = ${tenantId}::uuid`
            : Prisma.empty
        }
      GROUP BY tenant_id, operation
      ON CONFLICT (tenant_id, stat_date, operation) DO UPDATE SET
        total_count = EXCLUDED.total_count,
        fail_count  = EXCLUDED.fail_count,
        avg_time_ms = EXCLUDED.avg_time_ms,
        p95_time_ms = EXCLUDED.p95_time_ms
    `;

    // ============================================================
    // ⭐ 登录日志聚合（按租户）
    // ============================================================
    const loginRows = await prisma.$executeRaw`
      INSERT INTO sys_login_daily (
        id, tenant_id, stat_date,
        total_count, fail_count, unique_users
      )
      SELECT
        gen_random_uuid(),
        tenant_id,
        ${dateStr}::date AS stat_date,
        COUNT(*)::int AS total_count,
        COUNT(*) FILTER (WHERE status = '0')::int AS fail_count,
        COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)::int AS unique_users
      FROM sys_login_log
      WHERE created_at >= ${dateStr}::date
        AND created_at < ${dateStr}::date + INTERVAL '1 day'
        ${
          tenantId
            ? Prisma.sql`AND tenant_id = ${tenantId}::uuid`
            : Prisma.empty
        }
      GROUP BY tenant_id
      ON CONFLICT (tenant_id, stat_date) DO UPDATE SET
        total_count  = EXCLUDED.total_count,
        fail_count   = EXCLUDED.fail_count,
        unique_users = EXCLUDED.unique_users
    `;

    logger.info(
      { date: dateStr, auditOps, loginRows },
      "[audit-daily] aggregate done",
    );

    return { date: dateStr, auditOps, loginRows };
  }

  /* ============================================================
   * 概览（日期范围内累计）
   * ============================================================ */
  async getOverview(
    tenantId: string,
    dto: DailyQueryDTO,
  ): Promise<DailyOverview> {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    const whereSql = dto.operation
      ? Prisma.sql`AND operation = ${dto.operation}`
      : Prisma.empty;

    const [auditRows, loginAgg] = await Promise.all([
      prisma.$queryRaw<
        Array<{ total: bigint; fail: bigint; avg: number; p95: number }>
      >`
      SELECT
        COALESCE(SUM(total_count), 0)::bigint AS total,
        COALESCE(SUM(fail_count), 0)::bigint AS fail,
        COALESCE(
          ROUND(
            SUM(total_count * avg_time_ms) / NULLIF(SUM(total_count), 0)
          ), 0
        )::int AS avg,
        COALESCE(MAX(p95_time_ms), 0)::int AS p95
      FROM sys_audit_daily
      WHERE tenant_id = ${tenantId}::uuid
        AND stat_date >= ${start}::date
        AND stat_date <= ${end}::date
        ${whereSql}
    `,
      prisma.sys_login_daily.aggregate({
        where: {
          tenant_id: tenantId,
          stat_date: { gte: start, lte: end },
        },
        _sum: { total_count: true, fail_count: true, unique_users: true },
      }),
    ]);

    const r = auditRows[0] ?? { total: 0n, fail: 0n, avg: 0, p95: 0 };
    const totalRequests = Number(r.total);
    const totalFailures = Number(r.fail);
    const successRate =
      totalRequests > 0
        ? Number(
            (((totalRequests - totalFailures) / totalRequests) * 100).toFixed(
              2,
            ),
          )
        : 100;

    return {
      totalRequests,
      totalFailures,
      successRate,
      avgTimeMs: r.avg,
      p95TimeMs: r.p95,
      totalLogins: loginAgg._sum.total_count ?? 0,
      loginFailures: loginAgg._sum.fail_count ?? 0,
      uniqueUsers: loginAgg._sum.unique_users ?? 0,
    };
  }

  /* ============================================================
   * ⭐ 趋势数据（按天）
   * ============================================================ */
  async getTrend(
    tenantId: string,
    dto: DailyQueryDTO,
  ): Promise<{
    dates: string[];
    requests: number[];
    failures: number[];
    successRates: number[];
    avgTimes: number[];
    p95Times: number[];
    logins: number[];
    loginFailures: number[];
  }> {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    // 审计趋势
    const auditRows = await prisma.sys_audit_daily.groupBy({
      by: ["stat_date"],
      where: {
        tenant_id: tenantId,
        stat_date: { gte: start, lte: end },
        ...(dto.operation ? { operation: dto.operation } : {}),
      },
      _sum: { total_count: true, fail_count: true },
      _avg: { avg_time_ms: true, p95_time_ms: true },
      orderBy: { stat_date: "asc" },
    });

    // 登录趋势
    const loginRows = await prisma.sys_login_daily.groupBy({
      by: ["stat_date"],
      where: {
        tenant_id: tenantId,
        stat_date: { gte: start, lte: end },
      },
      _sum: { total_count: true, fail_count: true },
      orderBy: { stat_date: "asc" },
    });

    const loginMap = new Map(
      loginRows.map((r) => [
        toDateStr(r.stat_date),
        {
          logins: r._sum.total_count ?? 0,
          fails: r._sum.fail_count ?? 0,
        },
      ]),
    );

    // 补齐缺失日期（前端图表需要连续 x 轴）
    const dates = enumerateDates(start, end);

    const requests: number[] = [];
    const failures: number[] = [];
    const successRates: number[] = [];
    const avgTimes: number[] = [];
    const p95Times: number[] = [];
    const logins: number[] = [];
    const loginFailures: number[] = [];

    const auditMap = new Map(
      auditRows.map((r) => [
        toDateStr(r.stat_date),
        {
          total: r._sum.total_count ?? 0,
          fail: r._sum.fail_count ?? 0,
          avg: Math.round(r._avg.avg_time_ms ?? 0),
          p95: Math.round(r._avg.p95_time_ms ?? 0),
        },
      ]),
    );

    for (const d of dates) {
      const a = auditMap.get(d) ?? { total: 0, fail: 0, avg: 0, p95: 0 };
      const l = loginMap.get(d) ?? { logins: 0, fails: 0 };

      requests.push(a.total);
      failures.push(a.fail);
      successRates.push(
        a.total > 0
          ? Number((((a.total - a.fail) / a.total) * 100).toFixed(2))
          : 100,
      );
      avgTimes.push(a.avg);
      p95Times.push(a.p95);
      logins.push(l.logins);
      loginFailures.push(l.fails);
    }

    return {
      dates,
      requests,
      failures,
      successRates,
      avgTimes,
      p95Times,
      logins,
      loginFailures,
    };
  }

  /* ============================================================
   * ⭐ Top 操作（按请求量 / 失败数）
   * ============================================================ */
  async getTopOperations(tenantId: string, dto: DailyQueryDTO, limit = 20) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    const rows = await prisma.sys_audit_daily.groupBy({
      by: ["operation"],
      where: {
        tenant_id: tenantId,
        stat_date: { gte: start, lte: end },
      },
      _sum: { total_count: true, fail_count: true },
      _avg: { avg_time_ms: true, p95_time_ms: true },
      orderBy: { _sum: { total_count: "desc" } },
      take: limit,
    });

    if (rows.length === 0) return [];

    const operations = rows.map((r) => r.operation);

    const labels = await prisma.$queryRaw<
      { operation: string; label: string }[]
    >`
    SELECT DISTINCT ON (operation)
      operation,
      (metadata->>'label') AS label
    FROM sys_audit_log
    WHERE tenant_id = ${tenantId}::uuid
      AND operation IN (${Prisma.join(operations)})
      AND metadata ? 'label'
    ORDER BY operation, created_at DESC
  `;

    const labelMap = new Map(labels.map((l) => [l.operation, l.label]));

    return rows.map((r) => {
      const total = r._sum.total_count ?? 0;
      const fail = r._sum.fail_count ?? 0;
      return {
        operation: r.operation,
        operationLabel: labelMap.get(r.operation) ?? r.operation,
        totalCount: total,
        failCount: fail,
        failRate: total > 0 ? Number(((fail / total) * 100).toFixed(2)) : 0,
        avgTimeMs: Math.round(r._avg.avg_time_ms ?? 0),
        p95TimeMs: Math.round(r._avg.p95_time_ms ?? 0),
      };
    });
  }
  /* ============================================================
   * 操作列表（供筛选下拉）
   * ============================================================ */
  async listOperations(tenantId: string): Promise<string[]> {
    const rows = await prisma.sys_audit_daily.groupBy({
      by: ["operation"],
      where: { tenant_id: tenantId },
      orderBy: { operation: "asc" },
    });
    return rows.map((r) => r.operation);
  }

  /* ============================================================
   * 清理 2 年前的数据
   * ============================================================ */
  async cleanExpired(
    tenantId?: string,
  ): Promise<{ audit: number; login: number }> {
    const before = new Date();
    before.setFullYear(before.getFullYear() - 2);

    const [audit, login] = await Promise.all([
      prisma.sys_audit_daily.deleteMany({
        where: {
          stat_date: { lt: before },
          ...(tenantId ? { tenant_id: tenantId } : {}),
        },
      }),
      prisma.sys_login_daily.deleteMany({
        where: {
          stat_date: { lt: before },
          ...(tenantId ? { tenant_id: tenantId } : {}),
        },
      }),
    ]);

    logger.info(
      { before, audit: audit.count, login: login.count },
      "[audit-daily] cleaned",
    );
    return { audit: audit.count, login: login.count };
  }
  /** 清理指定租户 2 年前数据 */
  async cleanExpiredForTenant(
    tenantId: string,
  ): Promise<{ audit: number; login: number }> {
    if (!tenantId) throw new AppError("缺少租户ID", 400001, 400);
    return this.doClean(tenantId);
  }

  /** 全租户清理（仅限定时任务） */
  async cleanExpiredAllTenants(): Promise<{ audit: number; login: number }> {
    return this.doClean();
  }
  private async doClean(tenantId?: string) {
    const before = new Date();
    before.setFullYear(before.getFullYear() - 2);

    const [audit, login] = await Promise.all([
      prisma.sys_audit_daily.deleteMany({
        where: {
          stat_date: { lt: before },
          ...(tenantId ? { tenant_id: tenantId } : {}),
        },
      }),
      prisma.sys_login_daily.deleteMany({
        where: {
          stat_date: { lt: before },
          ...(tenantId ? { tenant_id: tenantId } : {}),
        },
      }),
    ]);

    logger.info(
      {
        before,
        tenantId: tenantId ?? "ALL",
        audit: audit.count,
        login: login.count,
      },
      "[audit-daily] cleaned",
    );
    return { audit: audit.count, login: login.count };
  }
}

/* ============================================================
 * 工具
 * ============================================================ */
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function enumerateDates(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const cur = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
  );
  const last = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()),
  );
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}
