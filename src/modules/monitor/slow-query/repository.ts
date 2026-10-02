import { prisma } from "@/config/database.js";
import { Prisma } from "@/generated/prisma/client.js";
import type {
  AggregatedRecord,
  SlowQueryListQuery,
  SlowQueryRow,
} from "./types.js";

export class SlowQueryRepository {
  /* ============================================================
   * 批量 UPSERT（核心写入路径）
   * ============================================================ */
  async upsertBatch(records: AggregatedRecord[]): Promise<number> {
    if (records.length === 0) return 0;

    // 用 Prisma.join 拼 VALUES，一次 SQL 完成全部写入
    const values = records.map(
      (r) => Prisma.sql`(
        gen_random_uuid(),
        ${r.tenantId}::uuid,
        ${r.fingerprint},
        ${r.rawSample.slice(0, 2000)},
        ${r.fingerprint},
        ${r.calls},
        ${r.totalTimeMs},
        ${r.totalTimeMs / Math.max(r.calls, 1)},
        ${r.maxTimeMs},
        ${r.maxTimeMs},
        ${r.rows},
        ${r.lastSeenAt},
        ${r.lastSeenAt},
        'open'
      )`,
    );

    const affected = await prisma.$executeRaw`
      INSERT INTO sys_slow_query_log (
        id, tenant_id, fingerprint, query_sample, query_hash,
        calls, total_time_ms, mean_time_ms, max_time_ms, p95_time_ms, rows,
        first_seen_at, last_seen_at, status
      )
      VALUES ${Prisma.join(values)}
      ON CONFLICT (fingerprint) DO UPDATE SET
        calls        = sys_slow_query_log.calls + EXCLUDED.calls,
        total_time_ms = sys_slow_query_log.total_time_ms + EXCLUDED.total_time_ms,
        mean_time_ms = (
          (sys_slow_query_log.total_time_ms + EXCLUDED.total_time_ms) /
          (sys_slow_query_log.calls + EXCLUDED.calls)
        )::int,
        max_time_ms  = GREATEST(sys_slow_query_log.max_time_ms, EXCLUDED.max_time_ms),
        p95_time_ms  = GREATEST(sys_slow_query_log.p95_time_ms, EXCLUDED.p95_time_ms),
        rows         = sys_slow_query_log.rows + EXCLUDED.rows,
        last_seen_at = EXCLUDED.last_seen_at,
        query_sample = EXCLUDED.query_sample
    `;

    return affected;
  }

  /* ============================================================
   * 列表
   * ============================================================ */
  async findPage(query: SlowQueryListQuery): Promise<{
    list: SlowQueryRow[];
    total: number;
    pageNum: number;
    pageSize: number;
    totalPages: number;
  }> {
    const pageNum = Math.max(1, query.pageNum || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 20));
    const skip = (pageNum - 1) * pageSize;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.tenantId) where.tenant_id = query.tenantId;
    if (query.keyword) where.query_sample = { contains: query.keyword };
    if (query.minMeanMs !== undefined)
      where.mean_time_ms = { gte: query.minMeanMs };
    if (query.minTotalMs !== undefined)
      where.total_time_ms = { gte: query.minTotalMs };

    const orderBy: any = (() => {
      switch (query.orderBy) {
        case "total":
          return { total_time_ms: "desc" };
        case "calls":
          return { calls: "desc" };
        case "last_seen":
          return { last_seen_at: "desc" };
        case "mean":
        default:
          return { mean_time_ms: "desc" };
      }
    })();

    const [list, total] = await Promise.all([
      prisma.sys_slow_query_log.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.sys_slow_query_log.count({ where }),
    ]);

    return {
      list: list as unknown as SlowQueryRow[],
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /* ============================================================
   * 详情
   * ============================================================ */
  async findById(id: string): Promise<SlowQueryRow | null> {
    return (await prisma.sys_slow_query_log.findUnique({
      where: { id },
    })) as SlowQueryRow | null;
  }

  /* ============================================================
   * 标记
   * ============================================================ */
  async review(
    id: string,
    status: string,
    note: string | null,
    reviewerId: string,
  ): Promise<number> {
    const r = await prisma.sys_slow_query_log.updateMany({
      where: { id },
      data: {
        status,
        review_note: note,
        reviewer_id: reviewerId,
        reviewed_at: new Date(),
      },
    });
    return r.count;
  }

  /* ============================================================
   * 清理
   * ============================================================ */
  async purgeOld(before: Date, limit = 5000): Promise<number> {
    const rows = await prisma.sys_slow_query_log.findMany({
      where: {
        last_seen_at: { lt: before },
        status: { in: ["resolved", "ignored"] },
      },
      select: { id: true },
      take: limit,
    });
    if (rows.length === 0) return 0;
    const r = await prisma.sys_slow_query_log.deleteMany({
      where: { id: { in: rows.map((x) => x.id) } },
    });
    return r.count;
  }

  /* ============================================================
   * 告警扫描
   * ============================================================ */
  async findForAlert(
    minMeanMs: number,
    minCalls: number,
    limit = 50,
  ): Promise<SlowQueryRow[]> {
    const rows = await prisma.sys_slow_query_log.findMany({
      where: {
        status: "open",
        mean_time_ms: { gte: minMeanMs },
        calls: { gte: minCalls },
        last_seen_at: { gte: new Date(Date.now() - 24 * 3600 * 1000) },
      },
      orderBy: { mean_time_ms: "desc" },
      take: limit,
    });
    return rows as unknown as SlowQueryRow[];
  }

  /* ============================================================
   * 按 fingerprint 查已有索引（辅助）
   * ============================================================ */
  async listTableIndexes(tableName: string): Promise<string[]> {
    const rows = await prisma.$queryRaw<Array<{ indexdef: string }>>`
      SELECT indexdef FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = ${tableName}
    `;
    return rows.map((r) => r.indexdef);
  }

  /* ============================================================
   * 从 pg_stat_statements 同步（补充数据源）
   * ============================================================ */
  async fetchFromPgStatStatements(
    limit: number,
  ): Promise<
    Array<{ query: string; calls: number; mean: number; total: number }>
  > {
    try {
      const rows = await prisma.$queryRaw<
        Array<{ query: string; calls: bigint; mean: number; total: number }>
      >`
        SELECT query, calls, mean_exec_time AS mean, total_exec_time AS total
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat_statements%'
          AND query NOT LIKE 'SELECT 1%'
        ORDER BY mean_exec_time DESC
        LIMIT ${limit}
      `;
      return rows.map((r) => ({
        query: r.query,
        calls: Number(r.calls),
        mean: Number(r.mean),
        total: Number(r.total),
      }));
    } catch {
      // pg_stat_statements 未开启
      return [];
    }
  }
}
