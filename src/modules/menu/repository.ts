import { prisma } from "@/config/database.js";
import { BaseQuery, PageResult } from "@/types/base-repository.js";
import { keysToCamelCase } from "@/common/utils/case-convert.js";
import { AppError } from "@/core/errors.js";
import type { MenuEntity } from "./types.js";
import { BaseRepository } from "@/core/base/repository.js";

export class MenuRepository extends BaseRepository<MenuEntity, any, any, any> {
  protected readonly model = prisma.sys_menu;
  protected readonly primaryKey = "menu_id";

  /** 租户全部菜单（供 Service 构建树用） */
  async findAllByTenant(tenantId: string): Promise<MenuEntity[]> {
    return this.model.findMany({
      where: { tenant_id: tenantId, is_deleted: 0, menu_type: { in: [1, 2] } },
      orderBy: { sort_order: "asc" },
    });
  }

  /**
   * 分页（⭐ 改用基类 paginate）
   */
  async findPage(query: BaseQuery, where: any): Promise<PageResult<any>> {
    return this.paginate(
      {
        ...query,
        maxPageSize: 100,
      },
      where,
      {
        defaultOrderBy: { sort_order: "asc" },
        extendWhere: ({ query }) => {
          const extra: Record<string, any> = {};
          if (query.menuName) extra.menu_name = { contains: query.menuName };
          if (query.status !== undefined) extra.status = query.status;
          return extra;
        },
      },
    );
  }

  /** 软删除：检查子菜单 */
  async softDelete(
    id: string,
    tenantId: string,
    userId?: string,
  ): Promise<any> {
    const children = await this.model.count({
      where: { parent_id: id, tenant_id: tenantId, is_deleted: 0 },
    });
    if (children > 0) {
      throw new AppError("存在子菜单，无法删除", 400001, 400);
    }
    return super.softDelete(id, tenantId, userId);
  }

  /** 按权限标识查（唯一性校验） */
  async findByPermission(
    permission: string,
    tenantId: string,
    excludeId?: string,
  ) {
    const where: any = {
      tenant_id: tenantId,
      permission,
      is_deleted: 0,
    };
    if (excludeId) where.menu_id = { not: excludeId };
    return this.model.findFirst({ where });
  }

  /** 按名称和父级查（唯一性校验） */
  async findByNameAndParent(
    name: string,
    parentId: string | null,
    tenantId: string,
    excludeId?: string,
  ) {
    const where: any = {
      tenant_id: tenantId,
      menu_name: name,
      parent_id: parentId,
      is_deleted: 0,
    };
    if (excludeId) where.menu_id = { not: excludeId };
    return this.model.findFirst({ where });
  }

  /** 菜单下的按钮 */
  async findButtonsByParent(
    parentId: string,
    tenantId: string,
  ): Promise<any[]> {
    const buttons = await this.model.findMany({
      where: {
        parent_id: parentId,
        menu_type: 3,
        tenant_id: tenantId,
        is_deleted: 0,
      },
      orderBy: { sort_order: "asc" },
    });
    return buttons.map((btn: any) => keysToCamelCase(btn));
  }

  /** 导出用（带 parent_name） */
  async findAllForExport(tenantId: string) {
    const menus = await this.model.findMany({
      where: { tenant_id: tenantId, is_deleted: 0 },
      orderBy: [{ parent_id: "asc" }, { sort_order: "asc" }],
    });
    const idToName = new Map<string, string>(
      menus.map((m: any) => [m.menu_id, m.menu_name]),
    );
    return menus.map((m: any) => ({
      ...m,
      parent_name: m.parent_id ? idToName.get(m.parent_id) || "" : "",
    }));
  }

  /** name → id 映射（导入时用） */
  async getNameToIdMap(tenantId: string): Promise<Map<string, string>> {
    const rows = await this.model.findMany({
      where: { tenant_id: tenantId, is_deleted: 0 },
      select: { menu_id: true, menu_name: true },
    });
    return new Map(rows.map((r: any) => [r.menu_name, r.menu_id]));
  }

  /** 插入单条菜单（导入时用，返回新 ID） */
  async insertMenu(data: {
    tenantId: string;
    parentId: string | null;
    menuName: string;
    menuType: number;
    icon?: string;
    path?: string;
    component?: string;
    permission?: string;
    sortOrder: number;
    status: string;
    userId?: string;
  }): Promise<string> {
    const record = await this.model.create({
      data: {
        tenant_id: data.tenantId,
        parent_id: data.parentId,
        menu_name: data.menuName,
        menu_type: data.menuType,
        icon: data.icon || null,
        path: data.path || null,
        component: data.component || null,
        permission: data.permission || null,
        sort_order: data.sortOrder,
        status: data.status,
        created_by: data.userId,
        updated_by: data.userId,
        created_at: new Date(),
        updated_at: new Date(),
        is_deleted: 0,
      },
    });
    return (record as any).menu_id;
  }
}
