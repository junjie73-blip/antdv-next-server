import { BaseRepository } from "@/core/base-repository.js";
import { prisma } from "@/config/database.js";
import { BaseQuery, PageResult } from "@/types/base-repository.js";

export class ConfigRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.sys_config;
  protected readonly primaryKey = "config_id";
  async findPage(
    query: BaseQuery & { keyword?: string },
    where: any,
  ): Promise<PageResult<any>> {
    const pageNum = Math.max(1, query.pageNum || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 10));
    const skip = (pageNum - 1) * pageSize;

    const finalWhere: any = {
      ...where,
      tenant_id: query.tenantId,
    };

    if (query.keyword) {
      finalWhere.OR = [
        { config_key: { contains: query.keyword } },
        { description: { contains: query.keyword } },
      ];
    }

    const scopedWhere = this.mergeDataScope(finalWhere);

    const [list, total] = await Promise.all([
      this.model.findMany({
        where: scopedWhere,
        skip,
        take: pageSize,
        orderBy: { config_key: "asc" },
      }),
      this.model.count({ where: scopedWhere }),
    ]);

    return {
      list,
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findByKey(key: string, tenantId: string, excludeId?: string) {
    const where: any = {
      tenant_id: tenantId,
      config_key: key,
    };
    if (excludeId) where.config_id = { not: excludeId };
    return this.model.findFirst({ where });
  }
}
