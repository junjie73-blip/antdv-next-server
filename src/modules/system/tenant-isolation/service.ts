import { TenantIsolationRepository } from "./repository.js";
import { SchemaScanner } from "./scanners/schema.scanner.js";
import { QueryScanner } from "./scanners/query.scanner.js";
import { logger } from "@/platform/logger/index.js";

export class TenantIsolationService {
  private repo = new TenantIsolationRepository();

  /**
   * 全量扫描（schema + query）
   */
  async runFullScan(
    triggerType: "ci" | "manual" | "cron" | "startup",
    triggeredBy?: string,
  ) {
    const run = await this.repo.startRun(triggerType, triggeredBy);

    let critical = 0,
      warning = 0,
      info = 0,
      newCount = 0,
      scannedTables = 0,
      scannedFiles = 0;

    try {
      // 1. schema 扫描
      const schemaResult = await new SchemaScanner(this.repo).run();
      scannedTables = schemaResult.scannedTables;
      newCount += schemaResult.newCount;

      // 2. query 扫描（可选；ts-morph 在生产环境不打包时可通过 env 关闭）
      if (process.env.TENANT_ISOLATION_SCAN_CODE !== "false") {
        try {
          const queryResult = await new QueryScanner(this.repo).run();
          scannedFiles = queryResult.scannedFiles;
          newCount += queryResult.newCount;
        } catch (err) {
          logger.warn(
            { err },
            "[tenant-isolation] query scanner failed (ts-morph missing?)",
          );
        }
      }

      // 3. 统计各 severity
      const stats = await this.repo.countBySeverity();
      critical = stats.critical;
      warning = stats.warning;
      info = stats.info;

      await this.repo.finishRun(run.run_id, {
        status: "completed",
        critical,
        warning,
        info,
        newCount,
        scannedTables,
        scannedFiles,
      });

      return { runId: run.run_id, critical, warning, info, newCount };
    } catch (err: any) {
      await this.repo.finishRun(run.run_id, {
        status: "failed",
        errorMsg: err?.message ?? "unknown",
      });
      throw err;
    }
  }

  async list(params: {
    severity?: string;
    resolved?: number;
    ruleCode?: string;
    pageNum: number;
    pageSize: number;
  }) {
    return this.repo.list(params);
  }

  async resolve(scanId: string, userId: string) {
    return this.repo.resolve(scanId, userId);
  }

  async getSummary() {
    return this.repo.getSummary();
  }
}
