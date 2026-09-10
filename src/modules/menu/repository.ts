import { BaseRepository } from "@/core/base-repository.js";
import { prisma } from "@/config/database.js";
import { BaseQuery, PageResult } from "@/types/base-repository.js";
import { keysToCamelCase } from "@/common/utils/case-convert.js";
import { AppError } from "@/middleware/error-handler.js";
import dayjs from "dayjs";

export class MenuRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.sys_menu;
  protected readonly primaryKey = "menu_id";
  /**
   * 获取菜单树（用于树形展示）
   */
  async findTree(tenantId: string): Promise<any[]> {
    const menus = await this.model.findMany({
      where: { tenant_id: tenantId, is_deleted: 0, menu_type: { in: [1, 2] } },
      orderBy: { sort_order: "asc" },
    });
    return this.buildTree(menus, null);
  }

  /**
   * 平铺列表（支持过滤）
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

    if (query.menuName) {
      finalWhere.menu_name = { contains: query.menuName };
    }
    if (query.status !== undefined) {
      finalWhere.status = query.status;
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

  /**
   * 重写软删除：检查是否存在子菜单
   */
  async softDelete(
    id: string,
    tenantId: string,
    userId?: string,
  ): Promise<any> {
    const children = await this.model.count({
      where: { parent_id: id, tenant_id: tenantId, is_deleted: 0 },
    });
    if (children > 0) {
      throw new AppError(400, "存在子菜单，无法删除", 400);
    }
    return super.softDelete(id, tenantId, userId);
  }

  /**
   * 构建树形结构
   */
  private buildTree(items: any[], parentId: string | null): any[] {
    return items
      .filter((item) => {
        if (parentId === null) {
          return (
            item.parent_id === null ||
            item.parent_id === undefined ||
            item.parent_id === "" ||
            item.parent_id === "00000000-0000-0000-0000-000000000000"
          );
        }
        return item.parent_id === parentId;
      })
      .map((item) => {
        const children = this.buildTree(items, item.menu_id);
        const node: any = {
          ...keysToCamelCase(item),
        };
        for (const key in node) {
          if (node[key] instanceof Date) {
            node[key] = dayjs(node[key]).format("YYYY-MM-DD HH:mm:ss");
          }
        }
        // 仅当 children 非空时才添加该字段
        if (children.length > 0) {
          node.children = children;
        }
        return node;
      });
  }

  /**
   * 检查同一父级下菜单名称是否已存在
   */
  async findByNameAndParent(
    name: string,
    parentId: string,
    tenantId: string,
    excludeId?: string,
  ) {
    const where: any = {
      tenant_id: tenantId,
      menu_name: name,
      parent_id: parentId,
      is_deleted: 0,
    };
    if (excludeId) {
      where.menu_id = { not: excludeId };
    }
    return this.model.findFirst({ where });
  }

  /**
   * 检查权限标识是否已存在（如果提供了 permission）
   */
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
    if (excludeId) {
      where.menu_id = { not: excludeId };
    }
    return this.model.findFirst({ where });
  }

  /**
   * 获取指定菜单下的所有按钮（menu_type = 3）
   * @param parentId 父菜单ID（UUID）
   * @param tenantId 租户ID
   */
  async findButtonsByParent(
    parentId: string,
    tenantId: string,
  ): Promise<any[]> {
    const buttons = await this.model.findMany({
      where: {
        parent_id: parentId,
        menu_type: 3, // 按钮类型
        tenant_id: tenantId,
        is_deleted: 0,
      },
      orderBy: { sort_order: "asc" },
    });
    // 转换为驼峰并返回
    return buttons.map((btn: any) => keysToCamelCase(btn));
  }
}
