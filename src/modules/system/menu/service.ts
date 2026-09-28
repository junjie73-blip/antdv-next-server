import { MenuRepository } from "./repository.js";
import { MenuImportRowSchema, MenuExportColumns } from "./schema.js";

import { AppError } from "@/core/errors.js";
import { keysToCamelCase } from "@/shared/utils/case-convert.js";
import type {
  MenuImportRow,
  MenuEntity,
  MenuNode,
  MicroAppConfig,
} from "./types.js";
import { randomUUID } from "crypto";
import { Prisma, sys_menu } from "@/generated/prisma/client.js";
import { BaseService } from "@/core/base/service.js";
import {
  generateExcel,
  parseExcel,
  importTreeData,
} from "@/platform/excel/service.js";
import dayjs from "dayjs";

type Tx = Prisma.TransactionClient;

// ============================================================
// 模块级无状态函数
// ============================================================

/** 按树深度排序：父节点先于子节点 */
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

/** 复制模板租户菜单到目标租户 */
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

    // ⭐ 新增字段一并复制
    micro_app: m.micro_app as Prisma.InputJsonValue | undefined,
    is_external: m.is_external,
    layout: m.layout,
    hidden: m.hidden,
    keep_alive: m.keep_alive,

    sort_order: m.sort_order,
    status: m.status,
    is_platform: 0,
    is_deleted: 0,
  }));

  const sorted = sortByTreeDepth(newMenus as sys_menu[]);

  await tx.sys_menu.createMany({
    data: sorted as Prisma.sys_menuCreateManyInput[],
    skipDuplicates: true,
  });

  return sorted.map((m) => m.menu_id);
}

// ============================================================
// Service
// ============================================================

export class MenuService extends BaseService<MenuRepository> {
  constructor(repository: MenuRepository) {
    super(repository);
  }

  // ============ 树 / 按钮 ============

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
          microApp: (item.micro_app as MicroAppConfig | null) ?? null,
          children: children.length > 0 ? children : undefined,
        } as any;
        for (const key in node) {
          if (node[key] instanceof Date) {
            node[key] = dayjs(node[key]).format("YYYY-MM-DD HH:mm:ss");
          }
        }
        if (node.children === undefined) delete (node as any).children;
        return node;
      });
  }

  async getTree(tenantId: string, menuType?: number[]): Promise<MenuNode[]> {
    const menus = await this.repository.findAllByTenant(tenantId, menuType);
    return this.buildTree(menus, null);
  }

  async changeStatus(
    id: string,
    status: string,
    tenantId: string,
  ): Promise<void> {
    await this.repository.updateStatus(id, status, tenantId);
  }

  async getButtons(parentId: string, tenantId: string): Promise<any[]> {
    if (!parentId) throw new AppError("缺少 parentId 参数", 400001, 400);
    return this.repository.findButtonsByParent(parentId, tenantId);
  }

  // ============ 校验 ============

  async checkBeforeCreate(dto: any, tenantId: string): Promise<void> {
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

    if (dto.permission) {
      await this.assertUnique(
        () => this.repository.findByPermission(dto.permission, tenantId),
        "权限标识",
        dto.permission,
      );
    }
  }

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

  // ============ 导入导出 ============

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

    const rowsToInsert: MenuImportRow[] = rows.map((raw) => {
      // ⭐ 微应用配置：Excel 里是 JSON 字符串，这里反序列化
      let microApp: MicroAppConfig | null = null;
      const rawMicro = raw["微应用配置"];
      if (rawMicro && typeof rawMicro === "string" && rawMicro.trim()) {
        try {
          microApp = JSON.parse(rawMicro) as MicroAppConfig;
        } catch {
          // Schema 已经校验过，理论上不会到这里
          microApp = null;
        }
      }

      return {
        menuName: raw["菜单名称"] as string,
        menuType: raw["类型"] === "目录" ? 1 : raw["类型"] === "菜单" ? 2 : 3,
        parentName: (raw["上级菜单"] || "").trim(),
        icon: raw["图标"] || "",
        path: raw["路由地址"] || "",
        component: raw["组件路径"] || "",
        permission: raw["权限标识"] || "",
        microApp,
        isExternal: raw["是否外链"] === "是",
        layout: raw["布局"] || null,
        hidden: raw["是否隐藏"] === "是",
        keepAlive: raw["是否缓存"] === "是",
        sortOrder: raw["排序"] ?? 0,
        status: raw["状态"] === "禁用" ? "0" : "1",
      };
    });

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

            // ⭐ 新增
            microApp: row.microApp,
            isExternal: row.isExternal,
            layout: row.layout,
            hidden: row.hidden,
            keepAlive: row.keepAlive,

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
