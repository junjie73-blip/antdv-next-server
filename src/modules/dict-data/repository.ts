import { BaseRepository } from "@/core/base-repository.js";
import { prisma } from "@/config/database.js";
import { BaseQuery, PageResult } from "@/types/base-repository.js";

export class DictDataRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.sys_dict_data;
  protected readonly primaryKey = "dict_data_id";
  async findByLabel(
    dictTypeId: string,
    label: string,
    tenantId: string,
    excludeId?: string,
  ) {
    const where: any = {
      tenant_id: tenantId,
      dict_type_id: dictTypeId,
      dict_label: label,
      is_deleted: 0,
    };
    if (excludeId) where.dict_data_id = { not: excludeId };
    return this.model.findFirst({ where });
  }
  /**
   * 重写分页查询，支持按字典类型、关键字、状态过滤
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

    if (query.dictTypeId) {
      finalWhere.dict_type_id = query.dictTypeId;
    }
    if (query.keyword) {
      finalWhere.OR = [
        { dict_label: { contains: query.keyword } },
        { dict_value: { contains: query.keyword } },
      ];
    }
    if (query.status !== undefined) {
      finalWhere.status = Number(query.status);
    }

    const [list, total] = await Promise.all([
      this.model.findMany({
        where: finalWhere,
        skip,
        take: pageSize,
        orderBy: { sort_order: "asc" },
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
  async findByDictCodeAndType(
    dictCode: string,
    tenantId: string,
    dictTypeId?: string,
  ) {
    const typeWhere: any = {
      dict_code: dictCode,
      tenant_id: tenantId,
      is_deleted: 0,
      status: 1,
    };
    if (dictTypeId) {
      typeWhere.dict_type_id = dictTypeId;
    }
    const dictType = await prisma.sys_dict_type.findFirst({ where: typeWhere });
    if (!dictType) return [];
    return this.model.findMany({
      where: {
        dict_type_id: dictType.dict_type_id,
        tenant_id: tenantId,
        is_deleted: 0,
        status: 1,
      },
      orderBy: { sort_order: "asc" },
    });
  }
}
