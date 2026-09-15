import { BaseRepository } from "@/core/base/repository.js";
import { prisma } from "@/config/database.js";
import { BaseQuery, PageResult } from "@/types/base-repository.js";
import { keysToSnakeCase } from "@/common/utils/case-convert.js";
import { AppError } from "@/middleware/error-handler.js";

export class DictTypeRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.sys_dict_type;
  protected readonly primaryKey = "dict_type_id";
  async findByDictCode(code: string, tenantId: string, excludeId?: string) {
    const where: any = {
      tenant_id: tenantId,
      dict_code: code,
      is_deleted: 0,
    };
    if (excludeId) where.dict_type_id = { not: excludeId };
    return this.model.findFirst({ where });
  }
  /**
   * 重写分页查询，支持关键字和状态过滤
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

    if (query.keyword) {
      finalWhere.OR = [
        { dict_code: { contains: query.keyword } },
        { dict_name: { contains: query.keyword } },
      ];
    }
    if (query.status !== undefined) {
      finalWhere.status = query.status;
    }
    const scopedWhere = this.mergeDataScope(finalWhere);

    const [list, total] = await Promise.all([
      this.model.findMany({
        where: scopedWhere,
        skip,
        take: pageSize,
        orderBy: { created_at: "desc" },
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

  /**
   * 重写删除方法，检查是否存在字典数据
   */
  async softDelete(
    id: string,
    tenantId: string,
    userId?: string,
  ): Promise<any> {
    const count = await prisma.sys_dict_data.count({
      where: {
        dict_type_id: id,
        tenant_id: tenantId,
        is_deleted: 0,
      },
    });
    if (count > 0) {
      throw new AppError("该字典类型下存在字典数据，无法删除", 400, 400);
    }
    return super.softDelete(id, tenantId, userId);
  }
  async findAllForExport(tenantId: string) {
    return this.model.findMany({
      where: { tenant_id: tenantId, is_deleted: 0 },
      orderBy: { created_at: "asc" },
    });
  }

  async getExistingCodes(tenantId: string): Promise<Set<string>> {
    const rows = await this.model.findMany({
      where: { tenant_id: tenantId, is_deleted: 0 },
      select: { dict_code: true },
    });
    return new Set(rows.map((r: any) => r.dict_code));
  }

  async getCodeToIdMap(tenantId: string): Promise<Map<string, string>> {
    const rows = await this.model.findMany({
      where: { tenant_id: tenantId, is_deleted: 0 },
      select: { dict_type_id: true, dict_code: true },
    });
    return new Map(rows.map((r: any) => [r.dict_code, r.dict_type_id]));
  }

  async insertType(data: any): Promise<string> {
    const record = await this.model.create({
      data: {
        tenant_id: data.tenantId,
        dict_code: data.dictCode,
        dict_name: data.dictName,
        description: data.description || null,
        status: data.status,
        created_by: data.userId,
        updated_by: data.userId,
        created_at: new Date(),
        updated_at: new Date(),
        is_deleted: 0,
      },
    });
    return (record as any).dict_type_id;
  }
  async findAllEnabled(tenantId: string, filter?: any) {
    return this.model.findMany({
      where: {
        tenant_id: tenantId,
        status: "1",
        is_deleted: 0,
        ...(filter?.dictTypeId ? { dict_type_id: filter.dictTypeId } : {}),
        ...(filter?.dictCode ? { dict_code: filter.dictCode } : {}),
      },
      orderBy: { created_at: "asc" },
      select: { dict_type_id: true, dict_code: true, dict_name: true },
    });
  }
}
