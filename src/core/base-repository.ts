import { prisma } from "@/config/database.js";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/** 字段映射配置，用于适配不同 Prisma 模型的字段命名 */
export interface FieldMapping {
  pk: string;
  tenantId: string;
  softDelete?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_FIELD_MAPPING: FieldMapping = {
  pk: "id",
  tenantId: "tenantId",
  softDelete: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
};

export class BaseRepository<T = any> {
  protected fieldMapping: FieldMapping;

  constructor(
    protected model: any,
    protected defaultOrderBy: Record<string, "asc" | "desc"> = {
      createdAt: "desc",
    },
    fieldMapping?: Partial<FieldMapping>,
  ) {
    this.fieldMapping = { ...DEFAULT_FIELD_MAPPING, ...fieldMapping };
  }

  private get softDeleteWhere(): Record<string, null> {
    const { softDelete } = this.fieldMapping;
    return softDelete ? { [softDelete]: null } : {};
  }

  private pkWhere(id: string, tenantId: string): Record<string, any> {
    const { pk, tenantId: tid } = this.fieldMapping;
    return { [pk]: id, [tid]: tenantId, ...this.softDeleteWhere };
  }

  async findById(id: string, tenantId: string): Promise<T | null> {
    return this.model.findUnique({ where: this.pkWhere(id, tenantId) });
  }

  async findMany(
    tenantId: string,
    page = 1,
    limit = 20,
    where?: Record<string, any>,
  ): Promise<PaginatedResult<T>> {
    const { tenantId: tid } = this.fieldMapping;
    const baseWhere = {
      ...where,
      [tid]: tenantId,
      ...this.softDeleteWhere,
    };
    const [data, total] = await Promise.all([
      this.model.findMany({
        where: baseWhere,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: this.defaultOrderBy,
      }),
      this.model.count({ where: baseWhere }),
    ]);
    return { data, total, page, limit };
  }

  async findAll(tenantId: string, where?: Record<string, any>): Promise<T[]> {
    const { tenantId: tid } = this.fieldMapping;
    return this.model.findMany({
      where: { ...where, [tid]: tenantId, ...this.softDeleteWhere },
      orderBy: this.defaultOrderBy,
    });
  }

  async create(data: Record<string, any>): Promise<T> {
    return this.model.create({ data });
  }

  async update(id: string, tenantId: string, data: Partial<T>): Promise<T> {
    const { updatedAt } = this.fieldMapping;
    const updateData: Record<string, any> = { ...data };
    if (updatedAt) updateData[updatedAt] = new Date();
    return this.model.update({
      where: this.pkWhere(id, tenantId),
      data: updateData,
    });
  }

  /** 软删除 */
  async delete(id: string, tenantId: string, deletedBy?: string): Promise<T> {
    const { softDelete, updatedAt } = this.fieldMapping;
    if (!softDelete) throw new Error("此模型不支持软删除");
    const data: Record<string, any> = {
      [softDelete]: new Date(),
      status: "INACTIVE",
    };
    if (deletedBy && updatedAt) data[updatedAt] = deletedBy;
    return this.model.update({
      where: this.pkWhere(id, tenantId),
      data,
    });
  }

  /** 物理删除 */
  async hardDelete(id: string, tenantId: string): Promise<T> {
    const { pk, tenantId: tid } = this.fieldMapping;
    return this.model.delete({ where: { [pk]: id, [tid]: tenantId } });
  }

  /** 恢复已删除记录 */
  async restore(id: string, tenantId: string): Promise<T> {
    const { softDelete, pk, tenantId: tid } = this.fieldMapping;
    if (!softDelete) throw new Error("此模型不支持软删除");
    return this.model.update({
      where: { [pk]: id, [tid]: tenantId, [softDelete]: { not: null } },
      data: { [softDelete]: null, status: "ACTIVE" },
    });
  }

  async findDeleted(tenantId: string, page = 1, limit = 20) {
    const { softDelete, tenantId: tid } = this.fieldMapping;
    if (!softDelete) throw new Error("此模型不支持软删除");
    const baseWhere = { [tid]: tenantId, [softDelete]: { not: null } };
    const [data, total] = await Promise.all([
      this.model.findMany({
        where: baseWhere,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [softDelete]: "desc" },
      }),
      this.model.count({ where: baseWhere }),
    ]);
    return { data, total, page, limit };
  }
}