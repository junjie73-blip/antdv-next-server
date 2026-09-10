import { BaseRepository } from "@/core/base-repository.js";
import { prisma } from "@/config/database.js";
import { BaseQuery, PageResult } from "@/types/base-repository.js";
import { AppError } from "@/middleware/error-handler.js";

export class PermissionRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.sys_permission;
  protected readonly primaryKey = "permission_id";
  /**
   * 分页查询，支持多条件过滤
   */
  async findPage(query: BaseQuery, where: any): Promise<PageResult<any>> {
    const pageNum = Math.max(1, query.pageNum || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 10));
    const skip = (pageNum - 1) * pageSize;

    const finalWhere: any = {
      ...where,
      tenant_id: query.tenantId,
      is_deleted: 0,
    };

    if (query.permCode) finalWhere.perm_code = { contains: query.permCode };
    if (query.permName) finalWhere.perm_name = { contains: query.permName };
    if (query.resourceType) finalWhere.resource_type = query.resourceType;
    if (query.status !== undefined) finalWhere.status = query.status;

    const [list, total] = await Promise.all([
      this.model.findMany({
        where: finalWhere,
        skip,
        take: pageSize,
        orderBy: { created_at: "desc" },
      }),
      this.model.count({ where: finalWhere }),
    ]);

    return {
      list,
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 重写创建前钩子（由 BaseController 调用），检查 perm_code 唯一性
   */
  async beforeCreate(data: any, tenantId: string): Promise<any> {
    const exist = await this.model.findFirst({
      where: { perm_code: data.permCode, tenant_id: tenantId, is_deleted: 0 },
    });
    if (exist) {
      throw new AppError(409, `权限编码 '${data.permCode}' 已存在`, 409);
    }
    return data;
  }

  /**
   * 重写更新前钩子，检查 perm_code 唯一性（排除自身）
   */
  async beforeUpdate(id: string, data: any, tenantId: string): Promise<any> {
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
        throw new AppError(409, `权限编码 '${data.permCode}' 已存在`, 409);
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
    if (excludeId) {
      where.perm_id = { not: excludeId };
    }
    return this.model.findFirst({ where });
  }
  async findFirst(where: any) {
    return this.model.findFirst({ where });
  }
}
