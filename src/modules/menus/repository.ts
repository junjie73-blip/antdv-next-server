import { BaseRepository } from "@common/core/base-repository.js";
import { prisma } from "@/config/database.js";

export class MenuRepository extends BaseRepository<any> {
  constructor() {
    super(prisma.menu);
  }

  async findTree(
    tenantId: string,
    options: { includeButtons?: boolean; roleIds?: string[] } = {},
  ) {
    const { includeButtons = false, roleIds } = options;

    const where: any = {
      tenantId,
      deletedAt: null,
      status: "ACTIVE",
      parentId: null, // 从根开始
    };

    // 如果指定了角色，通过 RoleMenu 过滤
    let menuIds: string[] | undefined;
    if (roleIds && roleIds.length > 0) {
      const roleMenus = await prisma.roleMenu.findMany({
        where: { roleId: { in: roleIds }, tenantId },
        select: { menuId: true },
      });
      menuIds = [...new Set(roleMenus.map((rm: any) => rm.menuId))];
    }

    const roots = await prisma.menu.findMany({
      where: {
        ...where,
        ...(menuIds ? { id: { in: menuIds } } : {}),
      },
      orderBy: { sortOrder: "asc" },
    });

    const buildTree = async (parentId: string | null): Promise<any[]> => {
      const items = await prisma.menu.findMany({
        where: {
          tenantId,
          deletedAt: null,
          status: "ACTIVE",
          parentId,
          ...(menuIds ? { id: { in: menuIds } } : {}),
          ...(includeButtons ? {} : { menuType: { not: "BUTTON" } }),
        },
        orderBy: { sortOrder: "asc" },
      });

      const result = [];
      for (const item of items) {
        const children = await buildTree(item.id);
        const node = {
          ...item,
          children: children.length > 0 ? children : undefined,
        };
        result.push(node);
      }
      return result;
    };

    const tree = [];
    for (const root of roots) {
      const children = await buildTree(root.id);
      tree.push({
        ...root,
        children: children.length > 0 ? children : undefined,
      });
    }

    return tree;
  }

  async findByRole(tenantId: string, roleId: string) {
    return prisma.roleMenu.findMany({
      where: { tenantId, roleId },
      include: { menu: true },
    });
  }

  async assignRole(tenantId: string, roleId: string, menuIds: string[]) {
    await prisma.roleMenu.deleteMany({
      where: { tenantId, roleId },
    });
    await prisma.roleMenu.createMany({
      data: menuIds.map((menuId) => ({ roleId, menuId, tenantId })),
      skipDuplicates: true,
    });
  }

  async getButtonPermissions(tenantId: string, roleIds: string[]) {
    const roleMenus = await prisma.roleMenu.findMany({
      where: { tenantId, roleId: { in: roleIds } },
      select: { menuId: true },
    });
    const menuIds = roleMenus.map((rm: any) => rm.menuId);

    const buttons = await prisma.menu.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: "ACTIVE",
        id: { in: menuIds },
        menuType: "BUTTON",
      },
      select: { permissionCode: true },
    });

    return buttons.map((b: any) => b.permissionCode).filter(Boolean);
  }
}
