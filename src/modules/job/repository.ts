import { BaseRepository } from "@/core/base-repository.js";
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
}
