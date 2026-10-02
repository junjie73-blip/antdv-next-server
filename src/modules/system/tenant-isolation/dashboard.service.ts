import { prisma } from "@/config/database.js";

export class TenantIsolationDashboardService {
  /** 顶部 4 张卡片 */
  async getOverview() {
    const [bySeverity, totalRuns, lastRun, resolvedTotal] = await Promise.all([
      prisma.sys_tenant_isolation_scan.groupBy({
        by: ["severity"],
        where: { resolved: 0 },
        _count: { scan_id: true },
      }),
      prisma.sys_tenant_isolation_run.count(),
      prisma.sys_tenant_isolation_run.findFirst({
        orderBy: { started_at: "desc" },
      }),
      prisma.sys_tenant_isolation_scan.count({ where: { resolved: 1 } }),
    ]);

    const map = Object.fromEntries(
      bySeverity.map((r) => [r.severity, r._count.scan_id]),
    );

    return {
      pendingCritical: map.critical ?? 0,
      pendingWarning: map.warning ?? 0,
      pendingInfo: map.info ?? 0,
      resolvedTotal,
      totalRuns,
      lastRunAt: lastRun?.finished_at ?? lastRun?.started_at ?? null,
      lastRunStatus: lastRun?.status ?? null,
    };
  }

  /** 近 N 天新增 vs 修复趋势 */
  async getTrend(days = 30) {
    const since = new Date(Date.now() - days * 86_400_000);

    const runs = await prisma.sys_tenant_isolation_run.findMany({
      where: { started_at: { gte: since }, status: "completed" },
      orderBy: { started_at: "asc" },
      select: {
        started_at: true,
        new_count: true,
        resolved_count: true,
        critical_count: true,
        warning_count: true,
      },
    });

    // 按天聚合
    const byDay = new Map<
      string,
      {
        newCount: number;
        resolvedCount: number;
        critical: number;
        warning: number;
      }
    >();
    for (const r of runs) {
      const key = r.started_at.toISOString().slice(0, 10);
      const cur = byDay.get(key) ?? {
        newCount: 0,
        resolvedCount: 0,
        critical: 0,
        warning: 0,
      };
      cur.newCount += r.new_count;
      cur.resolvedCount += r.resolved_count;
      cur.critical = Math.max(cur.critical, r.critical_count);
      cur.warning = Math.max(cur.warning, r.warning_count);
      byDay.set(key, cur);
    }

    const dates: string[] = [];
    const newCounts: number[] = [];
    const resolvedCounts: number[] = [];
    const criticalSeries: number[] = [];
    const warningSeries: number[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000)
        .toISOString()
        .slice(0, 10);
      dates.push(d);
      const v = byDay.get(d);
      newCounts.push(v?.newCount ?? 0);
      resolvedCounts.push(v?.resolvedCount ?? 0);
      criticalSeries.push(v?.critical ?? 0);
      warningSeries.push(v?.warning ?? 0);
    }

    return { dates, newCounts, resolvedCounts, criticalSeries, warningSeries };
  }

  /** 规则分布（Top 10） */
  async getRuleDistribution() {
    const rows = await prisma.sys_tenant_isolation_scan.groupBy({
      by: ["rule_code", "severity"],
      where: { resolved: 0 },
      _count: { scan_id: true },
      orderBy: { _count: { scan_id: "desc" } },
      take: 10,
    });
    return rows.map((r) => ({
      ruleCode: r.rule_code,
      severity: r.severity,
      count: r._count.scan_id,
    }));
  }

  /** 表热度 Top 10 */
  async getTableHeatmap() {
    const rows = await prisma.sys_tenant_isolation_scan.groupBy({
      by: ["table_name"],
      where: { resolved: 0, table_name: { not: "" } },
      _count: { scan_id: true },
      _max: { hit_count: true },
      orderBy: { _count: { scan_id: "desc" } },
      take: 10,
    });
    return rows.map((r) => ({
      tableName: r.table_name,
      issueCount: r._count.scan_id,
      maxHit: r._max.hit_count ?? 0,
    }));
  }

  /** 最近 10 次扫描历史 */
  async getRecentRuns() {
    return prisma.sys_tenant_isolation_run.findMany({
      orderBy: { started_at: "desc" },
      take: 10,
      select: {
        run_id: true,
        trigger_type: true,
        status: true,
        critical_count: true,
        warning_count: true,
        info_count: true,
        new_count: true,
        resolved_count: true,
        duration_ms: true,
        started_at: true,
        finished_at: true,
      },
    });
  }
}
