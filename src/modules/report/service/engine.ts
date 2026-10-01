import { prisma } from "@/config/database.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { SqlExecutor } from "./sql-executor.js";
import { ParamResolver, type ParamResolveContext } from "./param-resolver.js";
import { ReportCache } from "./report-cache.js";
import type {
  ExecuteReportResult,
  ParamDef,
  ReportColumn,
  ReportConfig,
} from "../types.js";
import {
  rpCacheHitTotal,
  rpQueryTotal,
  rpQueryDuration,
  rpCacheMissTotal,
  rpQueryRows,
} from "@/platform/metrics/report.js";

const MAX_REPORT_NAME_LENGTH = 128;

export interface ExecuteReportParams {
  reportCode: string;
  tenantId: string;
  userId: string;
  username: string;
  deptId?: string | null;
  roles?: string[];
  input: Record<string, any>;
  /** 是否使用缓存（默认 true） */
  useCache?: boolean;
}

export class ReportEngine {
  /* ============================================================
   * 执行报表
   * ============================================================ */
  async execute(params: ExecuteReportParams): Promise<ExecuteReportResult> {
    const start = Date.now();
    try {
      // 1. 校验
      this.validate(params);

      // 2. 查报表
      const report = await this.loadReport(params.reportCode, params.tenantId);

      // 3. 权限校验（如有 allowed_roles）
      await this.assertAccess(report, params);

      // 4. 参数解析
      const paramDefs = this.resolveParamDefs(report);
      const context = this.buildContext(params);
      const resolvedParams = ParamResolver.resolve(
        paramDefs,
        params.input,
        context,
      );

      // 5. 缓存命中检查
      const cacheKey = ReportCache.buildKey(
        params.tenantId,
        params.reportCode,
        resolvedParams,
      );

      if (params.useCache !== false) {
        const cached = await ReportCache.get(cacheKey);
        if (cached) {
          logger.debug(
            { reportCode: params.reportCode, tenantId: params.tenantId },
            "[report] 命中缓存",
          );
          return cached;
        }
      }

      // 6. 执行 SQL
      const sourceConfig = report.dataset.source_config as any;
      const execResult = await SqlExecutor.execute({
        sql: sourceConfig.sql,
        variables: resolvedParams,
        tenantId: params.tenantId,
        maxRows: sourceConfig.maxRows ?? 10_000,
        timeout: sourceConfig.timeout ?? 30_000,
        enforceTenant: sourceConfig.enforceTenant,
      });

      // 7. 构建列信息
      const config = (report.config as any) ?? {};
      const columns = this.buildColumns(config.columns, execResult.rows);

      // 8. 汇总计算
      const summary = this.computeSummary(config.summary, execResult.rows);

      const duration = Date.now() - start;

      const result: ExecuteReportResult = {
        reportId: report.report_id,
        reportCode: report.report_code,
        reportName: report.report_name,
        columns,
        rows: execResult.rows,
        total: execResult.rowCount,
        duration,
        chartConfig: config.chart,
        summary,
      };

      // 9. 写日志
      await this.writeLog({
        tenantId: params.tenantId,
        userId: params.userId,
        report,
        params: resolvedParams,
        result,
        duration,
      });

      // 10. 写缓存（小结果集）
      if (params.useCache !== false) {
        const cached = await ReportCache.get(cacheKey);
        if (cached) {
          rpCacheHitTotal.labels(params.tenantId, params.reportCode).inc();
          rpQueryTotal
            .labels(params.tenantId, params.reportCode, "cached")
            .inc();
          rpQueryDuration
            .labels(params.reportCode, "cached")
            .observe((Date.now() - start) / 1000);
          return cached;
        }
        rpCacheMissTotal.labels(params.tenantId, params.reportCode).inc();
      }

      logger.info(
        {
          reportCode: params.reportCode,
          rowCount: execResult.rowCount,
          duration,
          tenantId: params.tenantId,
        },
        "[report] 执行成功",
      );
      rpQueryTotal.labels(params.tenantId, params.reportCode, "success").inc();
      rpQueryDuration
        .labels(params.reportCode, "success")
        .observe(duration / 1000);
      rpQueryRows.labels(params.reportCode).observe(result.total);
      return result;
    } catch (err: any) {
      let status = err.code === 408001 ? "timeout" : "failed";
      rpQueryTotal.labels(params.tenantId, params.reportCode, status).inc();
      rpQueryDuration
        .labels(params.reportCode, status)
        .observe((Date.now() - start) / 1000);
      throw err;
    }
  }

  /* ============================================================
   * 加载报表（含数据集）
   * ============================================================ */
  private async loadReport(reportCode: string, tenantId: string) {
    const report = await prisma.rp_report.findFirst({
      where: {
        tenant_id: tenantId,
        report_code: reportCode,
        status: "1",
        is_deleted: 0,
      },
      include: {
        dataset: true,
      },
    });

    if (!report) {
      throw new AppError(`报表 ${reportCode} 不存在`, 404001, 404);
    }

    if (
      !report.dataset ||
      report.dataset.status !== "1" ||
      report.dataset.is_deleted !== 0
    ) {
      throw new AppError("报表数据集不可用", 400001, 400);
    }

    if (report.dataset.dataset_type !== "sql") {
      throw new AppError(
        `暂不支持的数据集类型：${report.dataset.dataset_type}`,
        400001,
        400,
      );
    }

    return report;
  }

  /* ============================================================
   * 权限校验
   * ============================================================ */
  private async assertAccess(
    report: any,
    params: ExecuteReportParams,
  ): Promise<void> {
    const allowedRoles = report.allowed_roles as string[] | null;
    if (!allowedRoles || allowedRoles.length === 0) return;

    const userRoles = params.roles ?? [];
    const hasAccess = allowedRoles.some((r) => userRoles.includes(r));

    if (!hasAccess) {
      throw new AppError("无权访问此报表", 403001, 403);
    }
  }

  /* ============================================================
   * 合并参数定义（报表 > 数据集）
   * ============================================================ */
  private resolveParamDefs(report: any): ParamDef[] {
    const datasetParams = (report.dataset.params as ParamDef[] | null) ?? [];
    const reportParams = (report.params as ParamDef[] | null) ?? [];

    // 报表参数覆盖数据集参数
    const merged = new Map<string, ParamDef>();
    for (const p of datasetParams) merged.set(p.name, p);
    for (const p of reportParams) merged.set(p.name, p);

    return [...merged.values()];
  }

  /* ============================================================
   * 构建上下文
   * ============================================================ */
  private buildContext(params: ExecuteReportParams): ParamResolveContext {
    const now = new Date();
    return {
      currentUser: {
        userId: params.userId,
        username: params.username,
        tenantId: params.tenantId,
        deptId: params.deptId,
        roles: params.roles,
      },
      now,
      today: now.toISOString().slice(0, 10),
    };
  }

  /* ============================================================
   * 构建列信息
   * ============================================================ */
  private buildColumns(
    configColumns: ReportColumn[] | undefined,
    rows: Record<string, any>[],
  ): ReportColumn[] {
    // 优先使用配置的列
    if (configColumns && configColumns.length > 0) {
      return configColumns.filter((c) => c.visible !== false);
    }

    // 从数据推断
    if (rows.length === 0) return [];

    return Object.keys(rows[0]).map((key) => ({
      key,
      label: key,
      type: this.inferType(rows[0][key]),
    }));
  }

  private inferType(value: any): ReportColumn["type"] {
    if (typeof value === "number") return "number";
    if (typeof value === "boolean") return "boolean";
    if (value instanceof Date) return "date";
    return "string";
  }

  /* ============================================================
   * 汇总计算
   * ============================================================ */
  private computeSummary(
    summaryConfig: ReportConfig["summary"],
    rows: Record<string, any>[],
  ): Record<string, any> | undefined {
    if (!summaryConfig?.enabled || summaryConfig.fields.length === 0) {
      return undefined;
    }
    if (rows.length === 0) return undefined;

    const result: Record<string, any> = {};

    for (const field of summaryConfig.fields) {
      const values = rows.map((r) => Number(r[field])).filter((v) => !isNaN(v));

      if (values.length === 0) {
        result[field] = 0;
        continue;
      }

      switch (summaryConfig.method) {
        case "sum":
          result[field] = values.reduce((a, b) => a + b, 0);
          break;
        case "avg":
          result[field] = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case "count":
          result[field] = values.length;
          break;
        case "max":
          result[field] = Math.max(...values);
          break;
        case "min":
          result[field] = Math.min(...values);
          break;
      }

      // 数值保留 2 位小数
      if (
        typeof result[field] === "number" &&
        !Number.isInteger(result[field])
      ) {
        result[field] = Math.round(result[field] * 100) / 100;
      }
    }

    return result;
  }

  /* ============================================================
   * 写日志
   * ============================================================ */
  private async writeLog(params: {
    tenantId: string;
    userId: string;
    report: any;
    params: Record<string, any>;
    result: ExecuteReportResult;
    duration: number;
  }): Promise<void> {
    try {
      await prisma.rp_report_log.create({
        data: {
          tenant_id: params.tenantId,
          report_id: params.report.report_id,
          report_code: params.report.report_code,
          params: params.params as any,
          row_count: params.result.total,
          duration_ms: params.duration,
          status: "1",
          created_by: params.userId,
        },
      });
    } catch (err: any) {
      logger.error({ err }, "[report] 写日志失败");
    }
  }

  /* ============================================================
   * 导出日志
   * ============================================================ */
  async logExport(params: {
    tenantId: string;
    userId: string;
    reportId: string;
    reportCode: string;
    exportType: string;
    rowCount: number;
    duration: number;
    error?: string;
    fileSize?: number;
  }): Promise<void> {
    try {
      await prisma.rp_report_log.create({
        data: {
          tenant_id: params.tenantId,
          report_id: params.reportId,
          report_code: params.reportCode,
          row_count: params.rowCount,
          duration_ms: params.duration,
          status: params.error ? "0" : "1",
          error_msg: params.error ?? null,
          export_type: params.exportType,
          created_by: params.userId,
        },
      });
    } catch (err: any) {
      logger.error({ err }, "[report] 写导出日志失败");
    }
  }

  /* ============================================================
   * 参数校验
   * ============================================================ */
  private validate(params: ExecuteReportParams): void {
    if (!params.reportCode) {
      throw new AppError("缺少报表编码", 400001, 400);
    }
    if (params.reportCode.length > MAX_REPORT_NAME_LENGTH) {
      throw new AppError("报表编码过长", 400001, 400);
    }
  }
}

export const reportEngine = new ReportEngine();
