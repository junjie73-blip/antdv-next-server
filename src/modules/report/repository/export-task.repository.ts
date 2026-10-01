import { prisma } from "@/config/database.js";
import { Prisma } from "@/generated/prisma/client.js";
import { BaseRepository } from "@/core/index.js";

export interface ExportTaskListParams {
  tenantId?: string;
  userId?: string;
  status?: string;
  reportCode?: string;
  pageNum?: number;
  pageSize?: number;
}

export class RpExportTaskRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.rp_export_task;
  protected readonly primaryKey = "task_id";
  protected readonly tenantField = "tenant_id";

  async findPage(params: ExportTaskListParams) {
    const { tenantId, userId, status, reportCode, pageNum, pageSize } = params;

    const where: Prisma.rp_export_taskWhereInput = {
      tenant_id: tenantId,
      user_id: userId,
    };
    if (status) where.status = status;
    if (reportCode) where.report_code = reportCode;

    const [list, total] = await Promise.all([
      this.model.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      this.model.count({ where }),
    ]);

    return {
      list,
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(taskId: string, tenantId: string) {
    return this.model.findFirst({
      where: { task_id: taskId, tenant_id: tenantId },
    });
  }

  async findByIdForUser(taskId: string, tenantId: string, userId: string) {
    return this.model.findFirst({
      where: { task_id: taskId, tenant_id: tenantId, user_id: userId },
    });
  }

  async create(data: Prisma.rp_export_taskUncheckedCreateInput) {
    return this.model.create({ data });
  }

  async update(
    taskId: string,
    data: Prisma.rp_export_taskUncheckedUpdateInput,
  ) {
    return this.model.update({
      where: { task_id: taskId },
      data: { ...data, updated_at: new Date() },
    });
  }

  /** 分页查询过期任务 */
  async findExpired(limit = 200) {
    return this.model.findMany({
      where: {
        status: "completed",
        expires_at: { lte: new Date() },
      },
      take: limit,
      select: { task_id: true, file_url: true, tenant_id: true },
    });
  }
}
