import { prisma } from "@/config/database.js";
import { AppError } from "@/core/errors.js";
import type { StorageBackendEntity } from "./types.js";

export class StorageBackendRepository {
  /* ============================================================
   * 查询
   * ============================================================ */
  async findById(id: string, tenantId: string) {
    return prisma.sys_storage_backend.findFirst({
      where: { backend_id: id, tenant_id: tenantId, is_deleted: 0 },
    });
  }

  async findByType(tenantId: string, backendType: string) {
    return prisma.sys_storage_backend.findFirst({
      where: {
        tenant_id: tenantId,
        backend_type: backendType,
        is_deleted: 0,
      },
    });
  }

  async findActive(tenantId: string) {
    return prisma.sys_storage_backend.findFirst({
      where: { tenant_id: tenantId, is_active: 1, is_deleted: 0 },
    });
  }

  /** 按优先级 + 健康度列出可切换后端 */
  async listHealthyByPriority(tenantId: string) {
    return prisma.sys_storage_backend.findMany({
      where: {
        tenant_id: tenantId,
        is_deleted: 0,
        is_healthy: 1,
      },
      orderBy: [{ priority: "desc" }, { created_at: "asc" }],
    });
  }

  async findPage(
    tenantId: string,
    query: {
      pageNum?: number;
      pageSize?: number;
      backendType?: string;
      keyword?: string;
    },
  ) {
    const pageNum = Math.max(1, query.pageNum || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 10));
    const skip = (pageNum - 1) * pageSize;

    const where: any = { tenant_id: tenantId, is_deleted: 0 };
    if (query.backendType) where.backend_type = query.backendType;
    if (query.keyword) where.backend_name = { contains: query.keyword };

    const [list, total] = await Promise.all([
      prisma.sys_storage_backend.findMany({
        where,
        orderBy: [
          { is_active: "desc" },
          { priority: "desc" },
          { created_at: "asc" },
        ],
        skip,
        take: pageSize,
      }),
      prisma.sys_storage_backend.count({ where }),
    ]);

    return {
      list,
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /* ============================================================
   * 写入
   * ============================================================ */
  async create(data: {
    tenantId: string;
    backendType: string;
    backendName: string;
    config: Record<string, unknown>;
    priority: number;
    remark?: string;
    userId?: string;
  }): Promise<string> {
    const record = await prisma.sys_storage_backend.create({
      data: {
        tenant_id: data.tenantId,
        backend_type: data.backendType,
        backend_name: data.backendName,
        config: data.config as any,
        priority: data.priority,
        remark: data.remark ?? null,
        is_active: 0,
        is_healthy: 1,
        created_by: data.userId,
        updated_by: data.userId,
      },
    });
    return record.backend_id;
  }

  async update(
    id: string,
    tenantId: string,
    data: Partial<{
      backendName: string;
      config: Record<string, unknown>;
      priority: number;
      remark: string | null;
    }>,
    userId?: string,
  ): Promise<void> {
    const updateData: any = { updated_by: userId, updated_at: new Date() };
    if (data.backendName !== undefined)
      updateData.backend_name = data.backendName;
    if (data.config !== undefined) updateData.config = data.config;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.remark !== undefined) updateData.remark = data.remark;

    const r = await prisma.sys_storage_backend.updateMany({
      where: { backend_id: id, tenant_id: tenantId, is_deleted: 0 },
      data: updateData,
    });
    if (r.count === 0) throw new AppError("存储后端不存在", 404001, 404);
  }

  /** 激活：先把该租户其他后端置为 inactive，再置当前为 active */
  async activate(id: string, tenantId: string, userId?: string): Promise<void> {
    await prisma.$transaction([
      prisma.sys_storage_backend.updateMany({
        where: { tenant_id: tenantId, is_deleted: 0, is_active: 1 },
        data: { is_active: 0, updated_by: userId, updated_at: new Date() },
      }),
      prisma.sys_storage_backend.update({
        where: { backend_id: id },
        data: { is_active: 1, updated_by: userId, updated_at: new Date() },
      }),
    ]);
  }

  async updateHealth(
    id: string,
    healthy: boolean,
    error: string | null,
  ): Promise<void> {
    await prisma.sys_storage_backend.update({
      where: { backend_id: id },
      data: {
        is_healthy: healthy ? 1 : 0,
        last_check_at: new Date(),
        last_check_err: error,
      },
    });
  }

  async softDelete(
    id: string,
    tenantId: string,
    userId?: string,
  ): Promise<void> {
    const exists = await this.findById(id, tenantId);
    if (!exists) throw new AppError("存储后端不存在", 404001, 404);
    if (exists.is_active === 1) {
      throw new AppError("无法删除当前激活的存储后端", 400001, 400);
    }
    await prisma.sys_storage_backend.update({
      where: { backend_id: id },
      data: { is_deleted: 1, updated_by: userId, updated_at: new Date() },
    });
  }
}
