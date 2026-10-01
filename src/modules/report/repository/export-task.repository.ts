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
