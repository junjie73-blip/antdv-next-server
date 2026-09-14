import { Prisma, sys_menu } from "@/generated/prisma/client.js";
import { randomUUID } from "node:crypto";

type Tx = Prisma.TransactionClient;

// ---------------------------------------------------------------
// 按树深度排序：父节点先于子节点
// 防止未来加了自引用外键后插入顺序出问题
// ---------------------------------------------------------------
function sortByTreeDepth<
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

// ---------------------------------------------------------------
// 复制模板租户菜单到目标租户
// 返回：新生成的全部 menu_id
// ---------------------------------------------------------------
export async function copyMenusFromTemplate(
  tx: Tx,
  templateTenantId: string,
  targetTenantId: string,
): Promise<string[]> {
  const sourceMenus = await tx.sys_menu.findMany({
    where: {
      tenant_id: templateTenantId,
      is_deleted: 0,
      is_platform: 0, // 平台级菜单不复制，所有租户共享
    },
    orderBy: { sort_order: "asc" },
  });

  if (sourceMenus.length === 0) return [];

  // oldId -> newId
  const idMap = new Map<string, string>();
  for (const m of sourceMenus) {
    idMap.set(m.menu_id, randomUUID());
  }

  // 构造新记录；父节点不在本批次的，parent_id 置 null
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

  // 父先子后
  const sorted = sortByTreeDepth(newMenus as sys_menu[]);

  await tx.sys_menu.createMany({ data: sorted });

  return sorted.map((m) => m.menu_id);
}

// ---------------------------------------------------------------
// 用户可见菜单 = 平台菜单 ∪ 用户角色授权的租户菜单
// ---------------------------------------------------------------
export interface MenuNode {
  id: string;
  parentId: string | null;
  name: string;
  type: number;
  icon: string | null;
  path: string | null;
  component: string | null;
  permission: string | null;
  sortOrder: number;
  children: MenuNode[];
}

export async function getUserMenus(
  tx: Tx,
  userId: string,
  tenantId: string,
): Promise<MenuNode[]> {
  // 1) 平台菜单
  const platformMenus = await tx.sys_menu.findMany({
    where: { is_platform: 1, is_deleted: 0, status: "1" },
  });

  // 2) 用户角色
  const userRoles = await tx.sys_user_role.findMany({
    where: { user_id: userId, tenant_id: tenantId },
    select: { role_id: true },
  });
  const roleIds = userRoles.map((r) => r.role_id);

  // 3) 角色绑定的菜单
  let tenantMenus: sys_menu[] = [];
  if (roleIds.length > 0) {
    const roleMenus = await tx.sys_role_menu.findMany({
      where: { role_id: { in: roleIds } },
      select: { menu_id: true },
    });
    const menuIds = [...new Set(roleMenus.map((r) => r.menu_id))];

    if (menuIds.length > 0) {
      tenantMenus = await tx.sys_menu.findMany({
        where: {
          menu_id: { in: menuIds },
          tenant_id: tenantId,
          is_deleted: 0,
          status: "1",
        },
      });
    }
  }

  // 4) 按 menu_id 去重合并（平台优先/或覆盖，效果一样）
  const merged = new Map<string, sys_menu>();
  for (const m of platformMenus) merged.set(m.menu_id, m);
  for (const m of tenantMenus) merged.set(m.menu_id, m);

  return buildMenuTree([...merged.values()]);
}

// ---------------------------------------------------------------
// 构建菜单树
// ---------------------------------------------------------------
function buildMenuTree(menus: sys_menu[]): MenuNode[] {
  const map = new Map<string, MenuNode>();
  for (const m of menus) {
    map.set(m.menu_id, {
      id: m.menu_id,
      parentId: m.parent_id,
      name: m.menu_name,
      type: m.menu_type,
      icon: m.icon,
      path: m.path,
      component: m.component,
      permission: m.permission,
      sortOrder: m.sort_order,
      children: [],
    });
  }

  const roots: MenuNode[] = [];
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortRec = (list: MenuNode[]) => {
    list.sort((a, b) => a.sortOrder - b.sortOrder);
    list.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);

  return roots;
}
