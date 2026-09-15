import { BaseRepository } from "@/core/base/repository.js";
import { prisma } from "@/config/database.js";

export class JobRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.sys_job;
  protected readonly primaryKey = "job_id";

  async findLogPage(query: any) {
    const pageNum = Math.max(1, query.pageNum || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 10));
    const skip = (pageNum - 1) * pageSize;
    const where: any = {};
    if (query.jobId) where.job_id = query.jobId;
    if (query.status) where.status = query.status;
    const [list, total] = await Promise.all([
      prisma.sys_job_log.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { created_at: "desc" },
      }),
      prisma.sys_job_log.count({ where }),
    ]);
    return {
      list,
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async clearLogs(jobId?: string) {
    await prisma.sys_job_log.deleteMany({
      where: jobId ? { job_id: jobId } : {},
    });
  }
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

  async findAllForExport(tenantId: string) {
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

  async insertJob(data: any): Promise<string> {
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
}
