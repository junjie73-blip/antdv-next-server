import { prisma } from "@/config/database.js";
import { BaseQuery, PageResult } from "@/types/base-repository.js";
import { JobRepository } from "./repository.js";
import type { JobLogEntity } from "./types.js";
import { BaseRepository } from "@/core/base/repository.js";

/**
 * 任务日志 Repository
 *
 * ⚠️ 注意：sys_job_log 没有 tenant_id 字段，
 *    查询时必须通过 jobId 反向过滤（由 Service 传入）
 */
export class JobLogRepository extends BaseRepository<
  JobLogEntity,
  any,
  any,
  any
> {
  protected readonly model = prisma.sys_job_log;
  protected readonly primaryKey = "log_id";

  /** ⭐ 日志表没有 tenant_id */
  protected useTenantFilter(): boolean {
    return false;
  }

  /** ⭐ 日志表无软删除 */
  protected isSoftDeleteTable(): boolean {
    return false;
  }

  /** ⭐ 日志表只增不改 */
  protected isUpdatableTable(): boolean {
    return false;
  }

  // ============================================================
  // 分页
  // ============================================================

  /**
   * 分页查询
   * @param query 查询参数
   * @param jobIds 该租户下的所有 jobId（由 Service 传入，用于租户隔离）
   */
  async findPageByTenant(
    query: BaseQuery & { jobId?: string; status?: string },
    jobIds: string[],
  ): Promise<PageResult<JobLogEntity>> {
    const baseWhere: Record<string, any> = {};

    // ⭐ 租户隔离：如果传了 jobId，用传的；否则用租户下所有 jobId
    if (query.jobId) {
      // 校验这个 jobId 是否属于该租户
      if (!jobIds.includes(query.jobId)) {
        return { list: [], total: 0, pageNum: 1, pageSize: 10, totalPages: 0 };
      }
      baseWhere.job_id = query.jobId;
    } else {
      baseWhere.job_id = { in: jobIds };
    }

    if (query.status) baseWhere.status = query.status;

    return this.paginate({ ...query, maxPageSize: 100 }, baseWhere, {
      defaultOrderBy: { created_at: "desc" },
    });
  }

  // ============================================================
  // 清空
  // ============================================================

  /**
   * 清空日志
   * @param jobIds 该租户下的所有 jobId
   * @param jobId 可选，指定任务 ID
   */
  async clearLogs(jobIds: string[], jobId?: string): Promise<number> {
    if (jobId) {
      // 校验该 jobId 属于当前租户
      if (!jobIds.includes(jobId)) return 0;
      const result = await this.model.deleteMany({ where: { job_id: jobId } });
      return result.count;
    }

    if (jobIds.length === 0) return 0;

    const result = await this.model.deleteMany({
      where: { job_id: { in: jobIds } },
    });
    return result.count;
  }

  // ============================================================
  // 写入（由 Scheduler 调用）
  // ============================================================

  async writeLog(data: {
    jobId: string;
    jobName: string;
    invokeTarget: string;
    jobMessage: string;
    status: string;
    retryAttempt?: number;
    durationMs?: number;
    exceptionInfo?: string;
    createdBy?: string;
  }): Promise<void> {
    await this.model.create({
      data: {
        job_id: data.jobId,
        job_name: data.jobName,
        invoke_target: data.invokeTarget,
        job_message: data.jobMessage,
        status: data.status,
        retry_attempt: data.retryAttempt ?? 0,
        duration_ms: data.durationMs ?? 0,
        exception_info: data.exceptionInfo ?? null,
        created_by: data.createdBy ?? null,
        created_at: new Date(),
      },
    });
  }
}
