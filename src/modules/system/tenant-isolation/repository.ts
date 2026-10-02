import { prisma } from "@/config/database.js";
import type { ScanRule } from "./rules.js";

export interface RecordViolationInput {
  scanType: "schema" | "query" | "runtime";
  rule: ScanRule;
  tableName?: string;
  columnName?: string;
  message: string;
  context?: Record<string, unknown>;
  suggestion?: string;
}

export class TenantIsolationRepository {
  /**
   * Upsert 违规记录：
   * - 已存在（同 rule + table + column）→ 更新 hit_count / last_seen_at
   * - 新 → create，返回 isNew
   */
  async recordViolation(
    input: RecordViolationInput,
  ): Promise<{ isNew: boolean }> {
    const tableName = input.tableName ?? "";
    const columnName = input.columnName ?? "";

    const existing = await prisma.sys_tenant_isolation_scan.findUnique({
      where: {
        rule_code_table_name_column_name: {
          rule_code: input.rule.code,
          table_name: tableName,
          column_name: columnName,
        },
      },
    });

    if (existing) {
      // 已 resolved 但再次发现 → 重新打开
      const shouldReopen = existing.resolved === 1;
      await prisma.sys_tenant_isolation_scan.update({
        where: { scan_id: existing.scan_id },
        data: {
          hit_count: { increment: 1 },
          last_seen_at: new Date(),
          severity: input.rule.severity,
          message: input.message,
          context: input.context as any,
          suggestion: input.suggestion,
          resolved: shouldReopen ? 0 : existing.resolved,
          resolved_at: shouldReopen ? null : existing.resolved_at,
          resolved_by: shouldReopen ? null : existing.resolved_by,
        },
      });
      return { isNew: shouldReopen };
    }

    await prisma.sys_tenant_isolation_scan.create({
      data: {
        scan_type: input.scanType,
        rule_code: input.rule.code,
        severity: input.rule.severity,
        table_name: tableName,
        column_name: columnName,
        message: input.message,
        context: input.context as any,
        suggestion: input.suggestion,
      },
    });
    return { isNew: true };
  }

  async startRun(
    triggerType: "ci" | "manual" | "cron" | "startup",
    triggeredBy?: string,
  ) {
    return prisma.sys_tenant_isolation_run.create({
      data: { trigger_type: triggerType, triggered_by: triggeredBy ?? null },
    });
  }

  async finishRun(
    runId: string,
    data: {
      status: "completed" | "failed";
      critical?: number;
      warning?: number;
      info?: number;
      newCount?: number;
      resolvedCount?: number;
      scannedTables?: number;
      scannedFiles?: number;
      errorMsg?: string;
    },
  ) {
    const run = await prisma.sys_tenant_isolation_run.findUnique({
      where: { run_id: runId },
      select: { started_at: true },
    });
    const duration = run ? Date.now() - run.started_at.getTime() : 0;

    await prisma.sys_tenant_isolation_run.update({
      where: { run_id: runId },
      data: {
        status: data.status,
        critical_count: data.critical ?? 0,
        warning_count: data.warning ?? 0,
        info_count: data.info ?? 0,
        new_count: data.newCount ?? 0,
        resolved_count: data.resolvedCount ?? 0,
        scanned_tables: data.scannedTables ?? 0,
        scanned_files: data.scannedFiles ?? 0,
        error_msg: data.errorMsg ?? null,
        finished_at: new Date(),
        duration_ms: duration,
      },
    });
  }

  async list(params: {
    severity?: string;
    resolved?: number;
    ruleCode?: string;
    pageNum: number;
    pageSize: number;
  }) {
    const where: any = {};
    if (params.severity) where.severity = params.severity;
    if (params.resolved !== undefined) where.resolved = params.resolved;
    if (params.ruleCode) where.rule_code = params.ruleCode;

    const [list, total] = await Promise.all([
      prisma.sys_tenant_isolation_scan.findMany({
        where,
        orderBy: [{ severity: "asc" }, { last_seen_at: "desc" }],
        skip: (params.pageNum - 1) * params.pageSize,
        take: params.pageSize,
      }),
      prisma.sys_tenant_isolation_scan.count({ where }),
    ]);

    return { list, total };
  }

  async resolve(scanId: string, userId: string) {
    await prisma.sys_tenant_isolation_scan.update({
      where: { scan_id: scanId },
      data: { resolved: 1, resolved_at: new Date(), resolved_by: userId },
    });
  }
  async countBySeverity(): Promise<{
    critical: number;
    warning: number;
    info: number;
  }> {
    const [c, w, i] = await Promise.all([
      prisma.sys_tenant_isolation_scan.count({
        where: { severity: "critical", resolved: 0 },
      }),
      prisma.sys_tenant_isolation_scan.count({
        where: { severity: "warning", resolved: 0 },
      }),
      prisma.sys_tenant_isolation_scan.count({
        where: { severity: "info", resolved: 0 },
      }),
    ]);
    return { critical: c, warning: w, info: i };
  }

  async getSummary() {
    const [pending, runs] = await Promise.all([
      prisma.sys_tenant_isolation_scan.groupBy({
        by: ["severity"],
        where: { resolved: 0 },
        _count: { scan_id: true },
      }),
      prisma.sys_tenant_isolation_run.findMany({
        orderBy: { started_at: "desc" },
        take: 10,
      }),
    ]);
    return { pending, runs };
  }
}
