import { BaseRepository } from "@/core/base/repository.js";
import { prisma } from "@/config/database.js";
import { BaseQuery, PageResult } from "@/types/base-repository.js";
import { AppError } from "@/middleware/error-handler.js";
import { PERMISSION_RESOURCE_TYPES } from "./schema.js";

/** 资源类型白名单（防 DTO 被绕过） */
const VALID_RESOURCE_TYPES = new Set<string>(PERMISSION_RESOURCE_TYPES);
export class PermissionRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.sys_permission;
  protected readonly primaryKey = "permission_id";
  async beforeCreate(data: any, tenantId: string): Promise<any> {
    // ⭐ 资源类型白名单校验
    if (!VALID_RESOURCE_TYPES.has(data.resourceType)) {
      throw new AppError(
        `不支持的资源类型「${data.resourceType}」，仅支持 api / data / other。` +
          `菜单 / 按钮权限请在「角色管理」中分配`,
        400,
        400,
      );
    }

    const exist = await this.model.findFirst({
      where: { perm_code: data.permCode, tenant_id: tenantId, is_deleted: 0 },
    });
    if (exist) {
      throw new AppError(`权限编码 '${data.permCode}' 已存在`, 409, 409);
    }
    return data;
  }

  /**
   * 更新前钩子：若改了资源类型则校验 + perm_code 唯一
   */
  async beforeUpdate(id: string, data: any, tenantId: string): Promise<any> {
    if (data.resourceType && !VALID_RESOURCE_TYPES.has(data.resourceType)) {
      throw new AppError(
        `不支持的资源类型「${data.resourceType}」，仅支持 api / data / other`,
        400,
        400,
      );
    }

    if (data.permCode) {
      const exist = await this.model.findFirst({
        where: {
          perm_code: data.permCode,
          tenant_id: tenantId,
          is_deleted: 0,
          perm_id: { not: id },
        },
      });
      if (exist) {
        throw new AppError(`权限编码 '${data.permCode}' 已存在`, 409, 409);
      }
    }
    return data;
  }
  /**
   * 检查权限编码是否已存在
   */
  async findByPermCode(code: string, tenantId: string, excludeId?: string) {
    const where: any = {
      tenant_id: tenantId,
      perm_code: code,
      is_deleted: 0,
    };
    if (excludeId) where.perm_id = { not: excludeId };
    return this.model.findFirst({ where });
  }
  async findAllForExport(tenantId: string) {
    return this.model.findMany({
      where: { tenant_id: tenantId, is_deleted: 0 },
      orderBy: { created_at: "desc" },
    });
  }

  async getExistingCodes(tenantId: string): Promise<Set<string>> {
    const rows = await this.model.findMany({
      where: { tenant_id: tenantId, is_deleted: 0 },
      select: { perm_code: true },
    });
    return new Set(rows.map((r: any) => r.perm_code));
  }

  async insertPermission(data: any): Promise<string> {
    const record = await this.model.create({
      data: {
        tenant_id: data.tenantId,
        perm_code: data.permCode,
        perm_name: data.permName,
        resource_type: data.resourceType,
        perm_action: data.permAction,
        description: data.description || null,
        status: data.status,
        created_by: data.userId,
        updated_by: data.userId,
        created_at: new Date(),
        updated_at: new Date(),
        is_deleted: 0,
      },
    });
    return (record as any).perm_id;
  }
}
