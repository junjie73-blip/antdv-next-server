import { BaseService } from "@/core/base/service.js";
import { ArchivePolicyRepository } from "../repository.js";
import { archiveExecutorService } from "./archive-executor.service.js";
import {
  getCachedAllPolicies,
  setCachedAllPolicies,
  getCachedPolicyByTable,
  setCachedPolicyByTable,
  invalidatePolicyCache,
} from "../cache.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import type {
  ArchivePolicyUpdateDTO,
  ArchiveTriggerDTO,
  ArchiveLogListDTO,
} from "../schema.js";
import type { ArchivePolicyEntity, ArchiveExecutionResult } from "../types.js";

export class ArchivePolicyService extends BaseService<ArchivePolicyRepository> {
  constructor(repo: ArchivePolicyRepository) {
    super(repo);
  }

  /* ============================================================
   * 列表 / 详情
   * ============================================================ */
  async list(): Promise<ArchivePolicyEntity[]> {
    const cached = await getCachedAllPolicies();
    if (cached) return cached;

    const rows = await this.repository.findAllEnabled();
    await setCachedAllPolicies(rows);
    return rows;
  }

  async getByTableName(tableName: string): Promise<ArchivePolicyEntity> {
    const cached = await getCachedPolicyByTable(tableName);
    if (cached) return cached;

    const policy = await this.repository.findByTableName(tableName);
    if (!policy) throw new AppError("归档策略不存在", 404001, 404);

    await setCachedPolicyByTable(tableName, policy);
    return policy;
  }

  /* ============================================================
   * 更新
   * ============================================================ */
  async update(
    tableName: string,
    dto: ArchivePolicyUpdateDTO,
    operatorId?: string,
  ): Promise<void> {
    const policy = await this.repository.findByTableName(tableName);
    if (!policy) throw new AppError("归档策略不存在", 404001, 404);

    const data: Record<string, unknown> = {};
    if (dto.displayName !== undefined) data.display_name = dto.displayName;
    if (dto.retentionMonths !== undefined)
      data.retention_months = dto.retentionMonths;
    if (dto.archiveEnabled !== undefined)
      data.archive_enabled = dto.archiveEnabled;
    if (dto.storageEnabled !== undefined)
      data.storage_enabled = dto.storageEnabled;
    if (dto.batchSize !== undefined) data.batch_size = dto.batchSize;
    if (dto.cronExpression !== undefined)
      data.cron_expression = dto.cronExpression;
    if (dto.enabled !== undefined) data.enabled = dto.enabled;
    if (dto.remark !== undefined) data.remark = dto.remark;

    await this.repository.updatePolicy(policy.policy_id, data, operatorId);
    await invalidatePolicyCache();

    this.log("update", { tableName, changes: Object.keys(data) });
  }

  /* ============================================================
   * 手动触发归档
   * ============================================================ */
  async trigger(
    dto: ArchiveTriggerDTO,
    operatorId?: string,
  ): Promise<ArchiveExecutionResult> {
    const policy = await this.getByTableName(dto.tableName);
    if (!policy.enabled) {
      throw new AppError("该策略已停用", 400001, 400);
    }

    logger.info(
      { tableName: dto.tableName, dryRun: dto.dryRun, operatorId },
      "[archive] manual trigger",
    );

    const result = await archiveExecutorService.execute({
      policyId: policy.policy_id,
      tableName: policy.table_name,
      tableType: policy.table_type,
      timeColumn: policy.time_column,
      retentionMonths: policy.retention_months,
      batchSize: policy.batch_size,
      storageEnabled: policy.storage_enabled === 1,
      operatorId,
      dryRun: dto.dryRun,
    });

    // 非 dry-run 才回写状态
    if (!dto.dryRun) {
      await this.repository.updateLastRun(
        policy.policy_id,
        result.status,
        result.status === "failed" ? "部分分区失败" : null,
      );
    }

    return result;
  }

  /* ============================================================
   * 定时执行（供 scheduler 调用）
   * ============================================================ */
  async runDuePolicies(): Promise<{
    total: number;
    success: number;
    failed: number;
    skipped: number;
    results: ArchiveExecutionResult[];
  }> {
    const policies = await this.list();
    const results: ArchiveExecutionResult[] = [];
    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (const policy of policies) {
      if (!policy.enabled) continue;

      try {
        const result = await archiveExecutorService.execute({
          policyId: policy.policy_id,
          tableName: policy.table_name,
          tableType: policy.table_type,
          timeColumn: policy.time_column,
          retentionMonths: policy.retention_months,
          batchSize: policy.batch_size,
          storageEnabled: policy.storage_enabled === 1,
        });

        results.push(result);
        if (result.status === "success") success++;
        else if (result.status === "failed") failed++;
        else skipped++;

        await this.repository.updateLastRun(
          policy.policy_id,
          result.status,
          result.status === "failed" ? "部分分区失败" : null,
        );
      } catch (err: any) {
        failed++;
        logger.error(
          { err, tableName: policy.table_name },
          "[archive] policy failed",
        );
        await this.repository.updateLastRun(
          policy.policy_id,
          "failed",
          err?.message ?? String(err),
        );
      }
    }

    logger.info(
      { total: policies.length, success, failed, skipped },
      "[archive] all policies executed",
    );

    return { total: policies.length, success, failed, skipped, results };
  }

  /* ============================================================
   * 日志查询
   * ============================================================ */
  async listLogs(query: ArchiveLogListDTO) {
    return this.repository.findLogPage(query);
  }

  /** 清理 30 天前的归档日志 */
  async cleanLogs(): Promise<number> {
    const before = new Date(Date.now() - 30 * 86400 * 1000);
    const n = await this.repository.cleanExpiredLogs(before);
    if (n > 0) this.log("cleanLogs", { count: n });
    return n;
  }
}
