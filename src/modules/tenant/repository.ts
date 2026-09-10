import { prisma } from "@/config/database.js";
import { BaseRepository } from "@/core/base-repository.js";
import { BaseQuery, PageResult } from "@/types/base-repository.js";

export class TenantRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.sys_tenant;
  protected readonly primaryKey = "tenant_id";
  async codeExists(
    tenantCode: string,
    tenantId: string,
    excludeId?: string,
  ): Promise<boolean> {
    const where: any = { tenant_code: tenantCode };
    if (excludeId) {
      where.tenant_id = { not: excludeId };
    }
    return this.exists(where, tenantId);
  }
  async findByTenantCode(code: string, tenantId: string, excludeId?: string) {
    const where: any = {
      tenant_code: code,
      is_deleted: 0,
    };
    if (excludeId) where.tenant_id = { not: excludeId };
    return this.model.findFirst({ where });
  }
  /**
   * 分页查询所有租户（平台级）
   */
  async findPage(
    query: BaseQuery & { keyword?: string; status?: string },
    where: any,
  ): Promise<PageResult<any>> {
    const pageNum = Math.max(1, query.pageNum || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 10));
    const skip = (pageNum - 1) * pageSize;

    const finalWhere: any = {
      ...where,
      is_deleted: 0,
      // ⚠️ 不添加 tenant_id 过滤，查全部
    };

    if (query.keyword) {
      finalWhere.OR = [
        { tenant_code: { contains: query.keyword } },
        { tenant_name: { contains: query.keyword } },
        { contact_name: { contains: query.keyword } },
      ];
    }
    if (query.status !== undefined && query.status !== "") {
      finalWhere.status = query.status;
    }

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
}

export default TenantRepository;
