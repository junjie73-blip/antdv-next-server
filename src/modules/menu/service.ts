import { MenuRepository } from "./repository.js";
import { MenuImportRowSchema, MenuExportColumns } from "./schema.js";

import { AppError } from "@/core/errors.js";
import { keysToCamelCase } from "@/shared/utils/case-convert.js";
import type { MenuImportRow, MenuEntity, MenuNode } from "./types.js";
import { randomUUID } from "crypto";
import { Prisma, sys_menu } from "@/generated/prisma/client.js";
import { BaseService } from "@/core/base/service.js";
import {
  generateExcel,
  parseExcel,
  importTreeData,
} from "@/platform/excel/service.js";

type Tx = Prisma.TransactionClient;

// ============================================================
// 模块级无状态函数（不依赖 this）
// ============================================================

/**
 * 按树深度排序：父节点先于子节点
 * 用于 copyMenusFromTemplate 保证插入顺序
 */
export function sortByTreeDepth<
  T extends { menu_id: string; parent_id: string | null },
>(nodes: T[]): T[] {
  const byId = new Map(nodes.map((n) => [n.menu_id, n]));
  const visited = new Set<string>();
  const result: T[] = [];

  const visit = (node: T) => {
    if (visited.has(node.menu_id)) return;
    visited.add(node.menu_id);
    if (node.parent_id && byId.has(node.parent_id)) {
      visit(byId.get(node.parent_id)!);
    }
    result.push(node);
  };

  nodes.forEach(visit);
  return result;
}

/**
 * 复制模板租户菜单到目标租户
 */
export async function copyMenusFromTemplate(
  tx: Tx,
  templateTenantId: string,
  targetTenantId: string,
): Promise<string[]> {
  const sourceMenus = await tx.sys_menu.findMany({
    where: {
      tenant_id: templateTenantId,
      is_deleted: 0,
      is_platform: 0,
    },
    orderBy: { sort_order: "asc" },
  });

  if (sourceMenus.length === 0) return [];

  const idMap = new Map<string, string>();
  for (const m of sourceMenus) {
    idMap.set(m.menu_id, randomUUID());
  }

  const newMenus: Prisma.sys_menuCreateManyInput[] = sourceMenus.map((m) => ({
    menu_id: idMap.get(m.menu_id)!,
    tenant_id: targetTenantId,
    parent_id: m.parent_id ? (idMap.get(m.parent_id) ?? null) : null,
    menu_name: m.menu_name,
    menu_type: m.menu_type,
    icon: m.icon,
    path: m.path,
    component: m.component,
    permission: m.permission,
    sort_order: m.sort_order,
    status: m.status,
    is_platform: 0,
    is_deleted: 0,
  }));

  // ⭐ 直接调用模块级函数，不通过 this
  const sorted = sortByTreeDepth(newMenus as sys_menu[]);

  await tx.sys_menu.createMany({ data: sorted, skipDuplicates: true });

  return sorted.map((m) => m.menu_id);
}

// ============================================================
// Service
// ============================================================

export class MenuService extends BaseService<any> {
  constructor(repository: MenuRepository) {
    super(repository);
  }

  // ============================================================
  // 树 / 按钮（从 Repository 移过来的无状态逻辑）
  // ============================================================

  /**
   * ⭐ 构建菜单树（无状态算法，从 Repository 移过来）
   */
  buildTree(items: MenuEntity[], parentId: string | null = null): MenuNode[] {
    return items
      .filter((item) => {
        if (parentId === null) {
          return (
            item.parent_id === null ||
            item.parent_id === undefined ||
            (item.parent_id as any) === "" ||
            item.parent_id === "00000000-0000-0000-0000-000000000000"
          );
        }
        return item.parent_id === parentId;
      })
      .map((item) => {
        const children = this.buildTree(items, item.menu_id);
        const node: MenuNode = {
          ...keysToCamelCase<any>(item),
          children: children.length > 0 ? children : undefined,
        } as any;
        if (node.children === undefined) delete (node as any).children;
        return node;
      });
  }

  /**
   * ⭐ 获取菜单树
   */
  async getTree(tenantId: string, menuType?: number[]): Promise<MenuNode[]> {
    const menus = await this.repository.findAllByTenant(tenantId, menuType);
    return this.buildTree(menus, null);
  }
  /**
   * ⭐ 改变菜单状态
   */
  async changeStatus(
    id: string,
    status: string,
    tenantId: string,
  ): Promise<void> {
    await this.repository.updateStatus(id, status, tenantId);
  }
  /**
   * ⭐ 获取菜单下的按钮列表
   */
  async getButtons(parentId: string, tenantId: string): Promise<any[]> {
    if (!parentId) throw new AppError("缺少 parentId 参数", 400001, 400);
    return this.repository.findButtonsByParent(parentId, tenantId);
  }

  // ============================================================
  // 校验
  // ============================================================

  /**
   * ⭐ 创建前唯一性校验
   */
  async checkBeforeCreate(dto: any, tenantId: string): Promise<void> {
    // 同一父级下菜单名唯一
    await this.assertUnique(
      () =>
        this.repository.findByNameAndParent(
          dto.menuName,
          dto.parentId ?? null,
          tenantId,
        ),
      "菜单名称",
      dto.menuName,
    );

    // 权限标识唯一（如果提供）
    if (dto.permission) {
      await this.assertUnique(
        () => this.repository.findByPermission(dto.permission, tenantId),
        "权限标识",
        dto.permission,
      );
    }
  }

  /**
   * 更新前唯一性校验
   */
  async checkBeforeUpdate(
    id: string,
    dto: any,
    tenantId: string,
  ): Promise<void> {
    if (dto.menuName && dto.parentId !== undefined) {
      const existing = await this.repository.findByNameAndParent(
        dto.menuName,
        dto.parentId ?? null,
        tenantId,
      );
      if (existing && existing.menu_id !== id) {
        throw new AppError(`菜单名称 '${dto.menuName}' 已存在`, 409001, 409);
      }
    }
    if (dto.permission) {
      const existing = await this.repository.findByPermission(
        dto.permission,
        tenantId,
        id,
      );
      if (existing) {
        throw new AppError(`权限标识 '${dto.permission}' 已存在`, 409001, 409);
      }
    }
  }

  // ============================================================
  // 导入导出
  // ============================================================

  async exportToExcel(tenantId: string): Promise<Buffer> {
    const menus = await this.repository.findAllForExport(tenantId);
    return generateExcel(menus, [...MenuExportColumns], "菜单数据");
  }

  async importFromExcel(
    buffer: Buffer,
    tenantId: string,
    userId?: string,
  ): Promise<{ successCount: number; failCount: number; errors: string[] }> {
    const { rows, errors: parseErrors } = parseExcel<Record<string, any>>(
      buffer,
      MenuImportRowSchema,
    );

    if (rows.length === 0) {
      return {
        successCount: 0,
        failCount: parseErrors.length,
        errors: parseErrors.map((e) => `第 ${e.rowNum} 行：${e.message}`),
      };
    }

    const existingMap = await this.repository.getNameToIdMap(tenantId);
    const errors: string[] = parseErrors.map(
      (e) => `第 ${e.rowNum} 行：${e.message}`,
    );
    let successCount = 0;

    const rowsToInsert = rows.map((raw) => ({
      menuName: raw["菜单名称"] as string,
      menuType: raw["类型"] === "目录" ? 1 : raw["类型"] === "菜单" ? 2 : 3,
      parentName: (raw["上级菜单"] || "").trim(),
      icon: raw["图标"] || "",
      path: raw["路由地址"] || "",
      component: raw["组件路径"] || "",
      permission: raw["权限标识"] || "",
      sortOrder: raw["排序"] ?? 0,
      status: raw["状态"] === "禁用" ? "0" : "1",
    })) as MenuImportRow[];

    const { successCount: inserted, errors: insertErrors } =
      await importTreeData(
        rowsToInsert,
        (r) => r.menuName,
        (r) => r.parentName,
        async (row, parentId) => {
          if (parentId === null && existingMap.has(row.menuName)) {
            throw new AppError(`菜单「${row.menuName}」已存在`, 409001, 409);
          }
          return this.repository.insertMenu({
            tenantId,
            parentId,
            menuName: row.menuName,
            menuType: row.menuType,
            icon: row.icon,
            path: row.path,
            component: row.component,
            permission: row.permission,
            sortOrder: row.sortOrder,
            status: row.status,
            userId,
          });
        },
      );

    successCount += inserted;
    insertErrors.forEach((e) =>
      errors.push(`菜单「${e.row.menuName}」：${e.message}`),
    );

    return { successCount, failCount: errors.length, errors };
  }
}
