import { prisma } from "@/config/database.js";
import { BaseQuery, PageResult } from "@/types/base-repository.js";
import type { TenantEntity, TenantOption } from "./types.js";
import { BaseRepository } from "@/core/base/repository.js";

export class TenantRepository extends BaseRepository<
  TenantEntity,
  any,
  any,
  any
> {
  protected readonly model = prisma.sys_tenant;
  protected readonly primaryKey = "tenant_id";

  /**
   * ⭐ 平台级表：跳过租户过滤
   * sys_tenant 本身就是租户表，不能按 tenant_id 过滤
   */
  protected useTenantFilter(): boolean {
    return false;
  }

  // ============================================================
  // 分页
  // ============================================================

  async findPage(
    query: BaseQuery & { keyword?: string; status?: string },
    where: any,
  ): Promise<PageResult<any>> {
    return this.paginate({ ...query, maxPageSize: 100 }, where, {
      defaultOrderBy: { created_at: "desc" },
      extendWhere: ({ query }) => {
        const extra: Record<string, any> = {};
        if (query.keyword) {
          extra.OR = [
            { tenant_code: { contains: query.keyword } },
            { tenant_name: { contains: query.keyword } },
            { contact_name: { contains: query.keyword } },
            { contact_email: { contains: query.keyword } },
            { contact_phone: { contains: query.keyword } },
          ];
        }
        if (query.status !== undefined) {
          extra.status = query.status;
        }
        return extra;
      },
    });
  }

  // ============================================================
  // 唯一性校验
  // ============================================================

  async findByTenantCode(code: string, excludeId?: string) {
    const where: any = {
      tenant_code: code,
      is_deleted: 0,
    };
    if (excludeId) where.tenant_id = { not: excludeId };
    return this.model.findFirst({ where });
  }

  async codeExists(code: string, excludeId?: string): Promise<boolean> {
    const exist = await this.findByTenantCode(code, excludeId);
    return !!exist;
  }

  // ============================================================
  // ⭐ 下拉选项（新增）
  // ============================================================

  /**
   * 查询租户下拉选项（仅返回 id / code / name）
   * - 只返回必要字段，减轻前端负担
   * - 只返回未删除的租户
   * - 只返回未过期（可选，由 status 参数控制）
   */
  async findOptions(
    options: {
      onlyEnabled?: boolean;
      keyword?: string;
      limit?: number;
    } = {},
  ): Promise<TenantOption[]> {
    const { onlyEnabled = true, keyword, limit = 100 } = options;

    const where: any = {
      is_deleted: 0,
    };
    if (onlyEnabled) {
      where.status = "1";
      // 排除已过期租户
      where.OR = [{ expire_time: null }, { expire_time: { gt: new Date() } }];
    }
    if (keyword) {
      where.AND = [
        {
          OR: [
            { tenant_code: { contains: keyword } },
            { tenant_name: { contains: keyword } },
          ],
        },
      ];
    }

    const rows = await this.model.findMany({
      where,
      select: {
        tenant_id: true,
        tenant_code: true,
        tenant_name: true,
      },
      orderBy: { tenant_code: "asc" },
    });

    return rows.map((r: any) => ({
      tenantId: r.tenant_id,
      tenantCode: r.tenant_code,
      tenantName: r.tenant_name,
    }));
  }

  // ============================================================
  // 导入导出
  // ============================================================

  async findAllForExport(where: any): Promise<TenantEntity[]> {
    return this.model.findMany({
      where: { ...where, is_deleted: 0 },
      orderBy: { created_at: "desc" },
    });
  }

  async getExistingCodes(): Promise<Set<string>> {
    const rows = await this.model.findMany({
      where: { is_deleted: 0 },
      select: { tenant_code: true },
    });
    return new Set(rows.map((r: any) => r.tenant_code));
  }

  async insertTenant(data: {
    tenantCode: string;
    tenantName: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    status: string;
    expireTime?: Date | null;
  }): Promise<string> {
    const record = await this.model.create({
      data: {
        tenant_code: data.tenantCode,
        tenant_name: data.tenantName,
        contact_name: data.contactName || null,
        contact_phone: data.contactPhone || null,
        contact_email: data.contactEmail || null,
        status: data.status,
        expire_time: data.expireTime ?? null,
        created_at: new Date(),
        updated_at: new Date(),
        is_deleted: 0,
      },
    });
    return (record as any).tenant_id;
  }
}
