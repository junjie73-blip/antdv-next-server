import { prisma } from "@/config/database.js";
import { Prisma } from "@/generated/prisma/client.js";

export class OrgHistoryDashboardService {
  /** 近 N 天每日变更数（按 scope 分堆叠） */
  async getDailyTrend(tenantId: string, days = 30) {
    const since = new Date(Date.now() - days * 86_400_000);
    const rows = await prisma.$queryRaw<
      Array<{
        date: string;
        scope: string | null;
        count: bigint;
      }>
    >`
      SELECT
        TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
        scope,
        COUNT(*)::bigint AS count
      FROM sys_org_history
      WHERE tenant_id = ${tenantId}::uuid
        AND created_at >= ${since}
      GROUP BY date, scope
      ORDER BY date ASC
    `;

    const byDate = new Map<string, Record<string, number>>();
    const scopes = new Set<string>();
    for (const r of rows) {
      const d = r.date;
      const s = r.scope ?? "other";
      scopes.add(s);
      const cur = byDate.get(d) ?? {};
      cur[s] = Number(r.count);
      byDate.set(d, cur);
    }

    const dates: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      dates.push(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10));
    }

    const scopeList = [...scopes];
    return {
      dates,
      scopes: scopeList,
      series: scopeList.map((s) => ({
        name: s,
        data: dates.map((d) => byDate.get(d)?.[s] ?? 0),
      })),
    };
  }

  /** 部门调动热度（哪些部门入/出人多） */
  async getDeptTransferHeatmap(tenantId: string, days = 30) {
    const since = new Date(Date.now() - days * 86_400_000);
    const rows = await prisma.$queryRaw<
      Array<{
        dept_id: string;
        dept_name: string;
        in_count: bigint;
        out_count: bigint;
        net: bigint;
      }>
    >`
      SELECT * FROM (
  SELECT
    h.related_id AS dept_id,
    d.dept_name,
    COUNT(*) FILTER (WHERE h.change_type = 'assign')::bigint AS in_count,
    COUNT(*) FILTER (WHERE h.change_type = 'revoke')::bigint AS out_count,
    (COUNT(*) FILTER (WHERE h.change_type = 'assign')
     - COUNT(*) FILTER (WHERE h.change_type = 'revoke'))::bigint AS net
  FROM sys_org_history h
  LEFT JOIN sys_dept d ON d.dept_id = h.related_id
  WHERE h.tenant_id = ${tenantId}::uuid
    AND h.entity_type = 'user_dept'
    AND h.related_id IS NOT NULL
    AND h.created_at >= ${since}
  GROUP BY h.related_id, d.dept_name
) t
ORDER BY (t.in_count + t.out_count) DESC
LIMIT 15
    `;

    return rows.map((r) => ({
      deptId: r.dept_id,
      deptName: r.dept_name ?? r.dept_id.slice(0, 8),
      inCount: Number(r.in_count),
      outCount: Number(r.out_count),
      net: Number(r.net),
    }));
  }

  /** Top 操作者（变更最频繁的人） */
  async getTopOperators(tenantId: string, days = 30) {
    const since = new Date(Date.now() - days * 86_400_000);
    return prisma.$queryRaw<
      Array<{
        operator_id: string;
        operator_name: string;
        count: bigint;
      }>
    >`
      SELECT operator_id, MAX(operator_name) AS operator_name, COUNT(*)::bigint AS count
      FROM sys_org_history
      WHERE tenant_id = ${tenantId}::uuid
        AND operator_id IS NOT NULL
        AND created_at >= ${since}
      GROUP BY operator_id
      ORDER BY count DESC
      LIMIT 10
    `.then((rows) => rows.map((r) => ({ ...r, count: Number(r.count) })));
  }

  /** 概览 KPI */
  async getOverview(tenantId: string) {
    const now = Date.now();
    const since30 = new Date(now - 30 * 86_400_000);

    const [total, byScope, topChangeType, latest] = await Promise.all([
      prisma.sys_org_history.count({ where: { tenant_id: tenantId } }),
      prisma.$queryRaw<Array<{ scope: string | null; count: bigint }>>`
        SELECT scope, COUNT(*)::bigint AS count
        FROM sys_org_history
        WHERE tenant_id = ${tenantId}::uuid AND created_at >= ${since30}
        GROUP BY scope
      `,
      prisma.$queryRaw<Array<{ change_type: string; count: bigint }>>`
        SELECT change_type, COUNT(*)::bigint AS count
        FROM sys_org_history
        WHERE tenant_id = ${tenantId}::uuid AND created_at >= ${since30}
        GROUP BY change_type
        ORDER BY count DESC LIMIT 1
      `,
      prisma.sys_org_history.findFirst({
        where: { tenant_id: tenantId },
        orderBy: { created_at: "desc" },
        select: { summary: true, created_at: true, operator_name: true },
      }),
    ]);

    return {
      total,
      last30dByScope: byScope.map((r) => ({
        scope: r.scope,
        count: Number(r.count),
      })),
      topChangeType: topChangeType[0]
        ? {
            changeType: topChangeType[0].change_type,
            count: Number(topChangeType[0].count),
          }
        : null,
      latest,
    };
  }
  async getDeptTimeMatrix(
    tenantId: string,
    days = 30,
    metric: "total" | "assign" | "revoke" = "total",
  ) {
    const since = new Date(Date.now() - days * 86_400_000);

    // 按 metric 决定过滤条件
    const typeFilter =
      metric === "assign"
        ? "AND h.change_type = 'assign'"
        : metric === "revoke"
          ? "AND h.change_type = 'revoke'"
          : "";

    const rows = await prisma.$queryRaw<
      Array<{
        date: string;
        dept_id: string;
        dept_name: string | null;
        count: bigint;
      }>
    >`
    SELECT
      TO_CHAR(h.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
      h.related_id AS dept_id,
      d.dept_name,
      COUNT(*)::bigint AS count
    FROM sys_org_history h
    LEFT JOIN sys_dept d ON d.dept_id = h.related_id
    WHERE h.tenant_id = ${tenantId}::uuid
      AND h.entity_type = 'user_dept'
      AND h.related_id IS NOT NULL
      AND h.created_at >= ${since}
      ${Prisma.raw(typeFilter)}
    GROUP BY date, h.related_id, d.dept_name
  `;

    // 1) 选 Top 20 部门（按总量）
    const deptTotal = new Map<string, { name: string; total: number }>();
    for (const r of rows) {
      const cur = deptTotal.get(r.dept_id) ?? {
        name: r.dept_name ?? r.dept_id.slice(0, 8),
        total: 0,
      };
      cur.total += Number(r.count);
      deptTotal.set(r.dept_id, cur);
    }

    const topDepts = [...deptTotal.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 20)
      .map(([id, v]) => ({ deptId: id, deptName: v.name }));

    // 2) 生成日期序列
    const dates: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      dates.push(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10));
    }

    // 3) 组装 matrix data
    const deptIndex = new Map(topDepts.map((d, i) => [d.deptId, i]));
    const dateIndex = new Map(dates.map((d, i) => [d, i]));
    const data: Array<[number, number, number]> = [];

    for (const r of rows) {
      const x = dateIndex.get(r.date);
      const y = deptIndex.get(r.dept_id);
      if (x === undefined || y === undefined) continue;
      data.push([x, y, Number(r.count)]);
    }

    // 4. 找出最大值供 visualMap 使用
    const max = data.reduce((m, d) => Math.max(m, d[2]), 0);

    return {
      dates,
      depts: topDepts.map((d) => d.deptName),
      deptIds: topDepts.map((d) => d.deptId),
      data,
      max,
      metric,
    };
  }

  /** 撤销链：从某条记录往上/往下追溯 */
  async getRevertChain(historyId: string, tenantId: string) {
    const chain: any[] = [];
    let currentId: string | null = historyId;
    const visited = new Set<string>();

    // 1) 向下：谁撤销了我（通过 reverted_by_history_id 反查）
    //    原记录 → 找到它的撤销记录 → 找撤销记录的撤销记录（如果有）
    while (currentId && !visited.has(currentId) && chain.length < 20) {
      visited.add(currentId);
      const node: any = await prisma.sys_org_history.findFirst({
        where: { history_id: currentId, tenant_id: tenantId },
      });
      if (!node) break;
      chain.push({
        historyId: node.history_id,
        summary: node.summary,
        changeType: node.change_type,
        source: node.source ?? "",
        operatorName: node.operator_name,
        createdAt: node.created_at,
        revertedAt: node.reverted_at,
        revertReason: node.revert_reason,
        revertedByHistoryId: node.reverted_by_history_id,
      });

      // 找这条记录的"撤销记录"（撤销时 target_source='system' 且 summary 含 [撤销]）
      const revertEvent: any = await prisma.sys_org_history.findFirst({
        where: {
          tenant_id: tenantId,
          source: "system",
          created_at: { gte: node.reverted_at ?? new Date() },
          summary: { startsWith: "[撤销]" },
          entity_type: node.entity_type,
          entity_id: node.entity_id,
        },
        orderBy: { created_at: "asc" },
      });
      currentId = revertEvent?.history_id ?? null;
    }

    // 2) 向上：我撤销了谁（reverted_by_history_id 反查）
    const parent: any = await prisma.sys_org_history.findFirst({
      where: { tenant_id: tenantId, reverted_by_history_id: historyId },
    });

    return { chain, parent };
  }
}
