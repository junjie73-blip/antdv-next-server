import { prisma } from "@/config/database.js";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
function withSoftDelete<T extends Record<string, any>>(where?: T): T {
  return { ...where, deletedAt: null } as T;
}
export class BaseRepository<T = any> {
  constructor(
    protected model: any, // Prisma model delegate, e.g. prisma.user
    protected defaultOrderBy: Record<string, "asc" | "desc"> = {
      createdAt: "desc",
    },
  ) {}

  async findById(id: string, tenantId: string): Promise<T | null> {
    return this.model.findUnique({
      where: { id, tenantId, deletedAt: null },
    });
  }

  async findMany(
    tenantId: string,
    page = 1,
    limit = 20,
    where?: Record<string, any>,
  ): Promise<PaginatedResult<T>> {
    const [data, total] = await Promise.all([
      this.model.findMany({
        where: withSoftDelete({ ...where, tenantId }),
        skip: (page - 1) * limit,
        take: limit,
        orderBy: this.defaultOrderBy,
      }),
      this.model.count({ where: withSoftDelete({ ...where, tenantId }) }),
    ]);
    return { data, total, page, limit };
  }

  async findAll(tenantId: string, where?: Record<string, any>): Promise<T[]> {
    return this.model.findMany({
      where: withSoftDelete({ ...where, tenantId }),
      orderBy: this.defaultOrderBy,
    });
  }

  async create(
    data: Omit<T, "id" | "createdAt" | "updatedAt"> & { tenantId: string },
  ): Promise<T> {
    return this.model.create({
      data: { ...data, status: (data as any).status || "ACTIVE" },
    });
  }

  async update(id: string, tenantId: string, data: Partial<T>): Promise<T> {
    return this.model.update({
      where: { id, tenantId, deletedAt: null },
      data: { ...data, updatedAt: new Date() },
    });
  }

  /** 软删除 */
  async delete(id: string, tenantId: string, deletedBy?: string): Promise<T> {
    return this.model.update({
      where: { id, tenantId, deletedAt: null },
      data: { deletedAt: new Date(), status: "INACTIVE", updatedBy: deletedBy },
    });
  }

  /** 物理删除（仅系统级清理使用） */
  async hardDelete(id: string, tenantId: string): Promise<T> {
    return this.model.delete({ where: { id, tenantId } });
  }

  /** 恢复已删除记录 */
  async restore(id: string, tenantId: string): Promise<T> {
    return this.model.update({
      where: { id, tenantId, deletedAt: { not: null } },
      data: { deletedAt: null, status: "ACTIVE" },
    });
  }
  async findDeleted(tenantId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.model.findMany({
        where: { tenantId, deletedAt: { not: null } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { deletedAt: "desc" },
      }),
      this.model.count({ where: { tenantId, deletedAt: { not: null } } }),
    ]);
    return { data, total, page, limit };
  }
}
