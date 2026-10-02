import { prisma } from "@/config/database.js";

export class ExportRepository {
  async create(data: {
    tenantId: string;
    userId: string;
    bizType: string;
    exportFormat?: string;
    queryParams?: unknown;
    columns?: unknown;
  }) {
    return prisma.sys_export_task.create({
      data: {
        tenant_id: data.tenantId,
        user_id: data.userId,
        biz_type: data.bizType,
        export_format: data.exportFormat ?? "xlsx",
        query_params: data.queryParams as any,
        columns: data.columns as any,
      },
    });
  }

  async findById(taskId: string) {
    return prisma.sys_export_task.findUnique({ where: { task_id: taskId } });
  }

  async update(taskId: string, patch: Record<string, unknown>) {
    return prisma.sys_export_task.update({
      where: { task_id: taskId },
      data: patch as any,
    });
  }

  async list(params: {
    tenantId: string;
    userId?: string;
    status?: string;
    bizType?: string;
    pageNum: number;
    pageSize: number;
  }) {
    const where: any = { tenant_id: params.tenantId, is_deleted: 0 };
    if (params.userId) where.user_id = params.userId;
    if (params.status) where.status = params.status;
    if (params.bizType) where.biz_type = params.bizType;

    const [list, total] = await Promise.all([
      prisma.sys_export_task.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (params.pageNum - 1) * params.pageSize,
        take: params.pageSize,
      }),
      prisma.sys_export_task.count({ where }),
    ]);
    return { list, total };
  }

  async countActive(userId: string): Promise<number> {
    return prisma.sys_export_task.count({
      where: {
        user_id: userId,
        status: { in: ["pending", "processing"] },
        is_deleted: 0,
      },
    });
  }

  async findExpired(limit = 100) {
    return prisma.sys_export_task.findMany({
      where: {
        status: "completed",
        expires_at: { lt: new Date() },
        is_deleted: 0,
      },
      take: limit,
    });
  }

  async findStuck(olderThanMs = 30 * 60_000) {
    return prisma.sys_export_task.findMany({
      where: {
        status: "processing",
        started_at: { lt: new Date(Date.now() - olderThanMs) },
      },
    });
  }

  async incrementDownload(taskId: string, ip: string) {
    await prisma.sys_export_task.update({
      where: { task_id: taskId },
      data: { download_count: { increment: 1 }, last_download_ip: ip },
    });
  }
}
