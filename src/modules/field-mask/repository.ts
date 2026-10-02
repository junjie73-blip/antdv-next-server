// src/modules/field-mask/repository.ts
import { prisma } from "@/config/database.js";
import { AppError } from "@/core/errors.js";
import type {
  FieldMaskCreateDTO,
  FieldMaskUpdateDTO,
  FieldMaskListDTO,
} from "./schema.js";

export class FieldMaskRepository {
  /* ============================================================
   * 查询
   * ============================================================ */
  async findById(id: string, tenantId: string) {
    return prisma.sys_field_mask_policy.findFirst({
      where: { policy_id: id, tenant_id: tenantId, is_deleted: 0 },
    });
  }

  /** 唯一性检查：同一租户下 name 不允许重复 */
  async findByName(name: string, tenantId: string, excludeId?: string) {
    const where: any = {
      tenant_id: tenantId,
      name,
      is_deleted: 0,
    };
    if (excludeId) where.policy_id = { not: excludeId };
    return prisma.sys_field_mask_policy.findFirst({ where });
  }

  /** 字段路径唯一性：同一租户下同一 field 不允许重复（避免冲突） */
  async findByField(field: string, tenantId: string, excludeId?: string) {
    const where: any = {
      tenant_id: tenantId,
      field,
      is_deleted: 0,
    };
    if (excludeId) where.policy_id = { not: excludeId };
    return prisma.sys_field_mask_policy.findFirst({ where });
  }

  /** 加载全部启用的策略（用于响应脱敏） */
  async listEnabled(tenantId: string) {
    return prisma.sys_field_mask_policy.findMany({
      where: { tenant_id: tenantId, is_deleted: 0, status: "1" },
      orderBy: { created_at: "asc" },
    });
  }

  /** 分页 */
  async findPage(tenantId: string, query: FieldMaskListDTO) {
    const pageNum = Math.max(1, query.pageNum || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 20));
    const skip = (pageNum - 1) * pageSize;

    const where: any = { tenant_id: tenantId, is_deleted: 0 };
    if (query.maskType) where.mask_type = query.maskType;
    if (query.status) where.status = query.status;
    if (query.keyword) {
      where.OR = [
        { name: { contains: query.keyword } },
        { field: { contains: query.keyword } },
        { description: { contains: query.keyword } },
      ];
    }

    const [list, total] = await Promise.all([
      prisma.sys_field_mask_policy.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.sys_field_mask_policy.count({ where }),
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
  async create(
    dto: FieldMaskCreateDTO,
    tenantId: string,
    userId?: string,
  ): Promise<string> {
    const record = await prisma.sys_field_mask_policy.create({
      data: {
        tenant_id: tenantId,
        name: dto.name,
        field: dto.field,
        mask_type: dto.maskType,
        pattern: dto.pattern ?? null,
        replace_char: dto.replaceChar,
        keep_prefix: dto.keepPrefix,
        keep_suffix: dto.keepSuffix,
        description: dto.description ?? null,
        status: dto.status,
        created_by: userId ?? null,
        updated_by: userId ?? null,
      },
    });
    return record.policy_id;
  }

  async update(
    id: string,
    dto: FieldMaskUpdateDTO,
    tenantId: string,
    userId?: string,
  ): Promise<void> {
    const data: any = {
      updated_by: userId ?? null,
      updated_at: new Date(),
    };

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.field !== undefined) data.field = dto.field;
    if (dto.maskType !== undefined) data.mask_type = dto.maskType;
    if (dto.pattern !== undefined) data.pattern = dto.pattern;
    if (dto.replaceChar !== undefined) data.replace_char = dto.replaceChar;
    if (dto.keepPrefix !== undefined) data.keep_prefix = dto.keepPrefix;
    if (dto.keepSuffix !== undefined) data.keep_suffix = dto.keepSuffix;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) data.status = dto.status;

    const r = await prisma.sys_field_mask_policy.updateMany({
      where: { policy_id: id, tenant_id: tenantId, is_deleted: 0 },
      data,
    });
    if (r.count === 0) throw new AppError("策略不存在", 404001, 404);
  }

  async softDelete(
    id: string,
    tenantId: string,
    userId?: string,
  ): Promise<void> {
    const r = await prisma.sys_field_mask_policy.updateMany({
      where: { policy_id: id, tenant_id: tenantId, is_deleted: 0 },
      data: {
        is_deleted: 1,
        updated_by: userId ?? null,
        updated_at: new Date(),
      },
    });
    if (r.count === 0) throw new AppError("策略不存在", 404001, 404);
  }
}
