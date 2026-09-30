import { BaseRepository } from "@/core/base/repository.js";
import { prisma } from "@/config/database.js";
import { BaseQuery, PageResult } from "@/types/base-repository.js";
import { AppError } from "@/middleware/http/error-handler.js";
import { PERMISSION_RESOURCE_TYPES } from "./schema.js";

export class PermissionRepository extends BaseRepository<any, any, any, any> {
  async findAll(tenantId: string) {
    return this.model.findMany({
      where: { tenant_id: tenantId, is_deleted: 0 },
    });
  }
  protected readonly model = prisma.sys_permission;
  protected readonly primaryKey = "perm_id";

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
