import { prisma } from "@/config/database.js";
import { BaseQuery, PageResult } from "@/types/base-repository.js";
import type { JobEntity } from "./types.js";
import { BaseRepository } from "@/core/base/repository.js";

export class JobRepository extends BaseRepository<JobEntity, any, any, any> {
  protected readonly model = prisma.sys_job;
  protected readonly primaryKey = "job_id";

  // ============================================================
  // 分页
  // ============================================================

  async findPage(query: BaseQuery, where: any): Promise<PageResult<any>> {
    return this.paginate({ ...query, maxPageSize: 100 }, where, {
      defaultOrderBy: { created_at: "desc" },
      extendWhere: ({ query }) => {
        const extra: Record<string, any> = {};
        if (query.jobName) extra.job_name = { contains: query.jobName };
        if (query.status) extra.status = query.status;
        return extra;
      },
    });
  }

  // ============================================================
  // 状态切换
  // ============================================================

  async updateStatus(
    jobId: string,
    status: string,
    tenantId: string,
  ): Promise<void> {
    await this.model.updateMany({
      where: { job_id: jobId, tenant_id: tenantId },
      data: { status, updated_at: new Date() },
    });
  }

  async setPaused(
    jobId: string,
    tenantId: string,
    paused: boolean,
  ): Promise<void> {
    await this.model.updateMany({
      where: { job_id: jobId, tenant_id: tenantId },
      data: { is_paused: paused ? 1 : 0, updated_at: new Date() },
    });
  }

  // ============================================================
  // 导入导出
  // ============================================================

  async findAllForExport(tenantId: string): Promise<JobEntity[]> {
    return this.model.findMany({
      where: { tenant_id: tenantId, is_deleted: 0 },
      orderBy: { created_at: "desc" },
    });
  }

  async getExistingNames(tenantId: string): Promise<Set<string>> {
    const rows = await this.model.findMany({
      where: { tenant_id: tenantId, is_deleted: 0 },
      select: { job_name: true },
    });
    return new Set(rows.map((r: any) => r.job_name));
  }

  async insertJob(data: {
    tenantId: string;
    jobName: string;
    jobGroup: string;
    invokeTarget: string;
    cronExpression: string;
    status: string;
    remark?: string;
    userId?: string;
  }): Promise<string> {
    const record = await this.model.create({
      data: {
        tenant_id: data.tenantId,
        job_name: data.jobName,
        job_group: data.jobGroup,
        invoke_target: data.invokeTarget,
        cron_expression: data.cronExpression,
        status: data.status,
        remark: data.remark || null,
        created_by: data.userId,
        updated_by: data.userId,
        created_at: new Date(),
        updated_at: new Date(),
        is_deleted: 0,
      },
    });
    return (record as any).job_id;
  }

  // ============================================================
  // 供 JobLogRepository 用：查租户下的所有 jobId
  // ⭐ sys_job_log 没有 tenant_id，只能通过 job_id 关联过滤
  // ============================================================

  async findAllJobIdsByTenant(tenantId: string): Promise<string[]> {
    const rows = await this.model.findMany({
      where: { tenant_id: tenantId, is_deleted: 0 },
      select: { job_id: true },
    });
    return rows.map((r: any) => r.job_id);
  }
}
