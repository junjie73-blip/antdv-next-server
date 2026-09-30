import { BaseRepository } from "@/core/base/repository.js";
import { prisma } from "@/config/database.js";
import { PERMISSION_RESOURCE_TYPES } from "./schema.js";

/** 资源类型白名单（防 DTO 被绕过） */
const VALID_RESOURCE_TYPES = new Set<string>(PERMISSION_RESOURCE_TYPES);

/**
 * ⚠️ Repository 只负责数据访问，不含业务校验
 * 校验全部在 PermissionService 中：
 *  - perm_code 唯一性（beforeCreate / beforeUpdate）
 *  - resourceType 白名单
 *  - data 类型无 action 等规则
 */
export class PermissionRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.sys_permission;
  protected readonly primaryKey = "perm_id";

  async findAll(tenantId: string) {
    return this.model.findMany({
      where: { tenant_id: tenantId, is_deleted: 0 },
      orderBy: { created_at: "desc" },
    });
  }

  /** 按权限编码查询（唯一性校验用） */
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
        perm_action: data.permAction ?? null, // ✅ 兼容 data 类型为 null
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

  /** 导出方法（供 service 使用），内部做白名单检查（防御性） */
  static assertResourceType(value: string): void {
    if (!VALID_RESOURCE_TYPES.has(value)) {
      throw new Error(
        `Invalid resource type: ${value}, allowed: ${[...VALID_RESOURCE_TYPES].join(", ")}`,
      );
    }
  }
}
