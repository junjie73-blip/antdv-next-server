import { prisma } from "@/config/database.js";
import { AppError } from "@/core/errors.js";
import type { FieldMaskPolicyEntity } from "./types.js";

export class FieldMaskRepository {
  async findById(id: string, tenantId: string) {
    return prisma.sys_field_mask_policy.findFirst({
      where: { policy_id: id, tenant_id: tenantId, is_deleted: 0 },
    });
  }

  /** 加载全租户策略（供缓存用） */
  async listEnabled(tenantId: string): Promise<FieldMaskPolicyEntity[]> {
    return prisma.sys_field_mask_policy.findMany({
      where: { tenant_id: tenantId, is_deleted: 0, enabled: 1 },
    }) as unknown as Promise<FieldMaskPolicyEntity[]>;
  }

  async findPage(
    tenantId: string,
    query: {
      pageNum?: number;
      pageSize?: number;
      resource?: string;
      field?: string;
      enabled?: number;
    },
  ) {
    const pageNum = Math.max(1, query.pageNum || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 20));
    const skip = (pageNum - 1) * pageSize;

    const where: any = { tenant_id: tenantId, is_deleted: 0 };
    if (query.resource) where.resource = query.resource;
    if (query.field) where.field = query.field;
    if (query.enabled !== undefined) where.enabled = query.enabled;

    const [list, total] = await Promise.all([
      prisma.sys_field_mask_policy.findMany({
        where,
        orderBy: [{ resource: "asc" }, { field: "asc" }],
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

  async create(data: {
    tenantId: string;
    resource: string;
    field: string;
    roleScope: string;
    maskType: string;
    maskRule?: string | null;
    enabled: number;
    remark?: string;
    userId?: string;
  }): Promise<string> {
    const r = await prisma.sys_field_mask_policy.create({
      data: {
        tenant_id: data.tenantId,
        resource: data.resource,
        field: data.field,
        role_scope: data.roleScope,
        mask_type: data.maskType,
        mask_rule: data.maskRule ?? null,
        enabled: data.enabled,
        remark: data.remark ?? null,
        created_by: data.userId,
        updated_by: data.userId,
      },
    });
    return r.policy_id;
  }

  async update(
    id: string,
    tenantId: string,
    data: Partial<{
      resource: string;
      field: string;
      roleScope: string;
      maskType: string;
      maskRule: string | null;
      enabled: number;
      remark: string | null;
    }>,
    userId?: string,
  ) {
    const updateData: any = { updated_by: userId, updated_at: new Date() };
    if (data.resource !== undefined) updateData.resource = data.resource;
    if (data.field !== undefined) updateData.field = data.field;
    if (data.roleScope !== undefined) updateData.role_scope = data.roleScope;
    if (data.maskType !== undefined) updateData.mask_type = data.maskType;
    if (data.maskRule !== undefined) updateData.mask_rule = data.maskRule;
    if (data.enabled !== undefined) updateData.enabled = data.enabled;
    if (data.remark !== undefined) updateData.remark = data.remark;

    const r = await prisma.sys_field_mask_policy.updateMany({
      where: { policy_id: id, tenant_id: tenantId, is_deleted: 0 },
      data: updateData,
    });
    if (r.count === 0) throw new AppError("策略不存在", 404001, 404);
  }

  async softDelete(id: string, tenantId: string, userId?: string) {
    const r = await prisma.sys_field_mask_policy.updateMany({
      where: { policy_id: id, tenant_id: tenantId, is_deleted: 0 },
      data: { is_deleted: 1, updated_by: userId, updated_at: new Date() },
    });
    if (r.count === 0) throw new AppError("策略不存在", 404001, 404);
  }

  /** 唯一性检查 */
  async findDuplicate(
    tenantId: string,
    resource: string,
    field: string,
    roleScope: string,
    excludeId?: string,
  ) {
    const where: any = {
      tenant_id: tenantId,
      resource,
      field,
      role_scope: roleScope,
      is_deleted: 0,
    };
    if (excludeId) where.policy_id = { not: excludeId };
    return prisma.sys_field_mask_policy.findFirst({ where });
  }
}
