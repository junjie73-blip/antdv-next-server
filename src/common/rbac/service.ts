import { prisma } from "@/config/database.js";
import { rbacCache } from "./cache.js";
import { SYSTEM_ROLE } from "./constants.js";

export class RbacService {
  /** 获取用户的所有权限编码（含缓存） */
  async getUserPermissions(
    tenantId: string,
    userId: string,
  ): Promise<string[]> {
    const cached = await rbacCache.getPermissions(tenantId, userId);
    if (cached) return cached;

    const userRoles = await prisma.userRole.findMany({
      where: { userId, tenantId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const permSet = new Set<string>();
    for (const ur of userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permSet.add(rp.permission.code);
      }
    }

    const permissions = Array.from(permSet);
    await rbacCache.setPermissions(tenantId, userId, permissions);
    return permissions;
  }

  /** 获取用户的所有角色编码 */
  async getUserRoles(tenantId: string, userId: string): Promise<string[]> {
    const cached = await rbacCache.getRoles(tenantId, userId);
    if (cached) return cached;

    const userRoles = await prisma.userRole.findMany({
      where: { userId, tenantId },
      include: { role: true },
    });

    const roles = userRoles.map((ur) => ur.role.code);
    await rbacCache.setRoles(tenantId, userId, roles);
    return roles;
  }

  /** 检查是否拥有任意一个权限 */
  async hasAnyPermission(
    tenantId: string,
    userId: string,
    permissions: string[],
  ): Promise<boolean> {
    if (permissions.length === 0) return true;
    const userPerms = await this.getUserPermissions(tenantId, userId);
    // OWNER 拥有所有权限
    if (userPerms.includes("*") || (await this.isOwner(tenantId, userId)))
      return true;
    return permissions.some((p) => userPerms.includes(p));
  }

  /** 检查是否拥有所有指定权限 */
  async hasAllPermissions(
    tenantId: string,
    userId: string,
    permissions: string[],
  ): Promise<boolean> {
    if (permissions.length === 0) return true;
    const userPerms = await this.getUserPermissions(tenantId, userId);
    if (await this.isOwner(tenantId, userId)) return true;
    return permissions.every((p) => userPerms.includes(p));
  }

  /** 检查是否拥有任意一个角色 */
  async hasAnyRole(
    tenantId: string,
    userId: string,
    roles: string[],
  ): Promise<boolean> {
    if (roles.length === 0) return true;
    const userRoles = await this.getUserRoles(tenantId, userId);
    return roles.some((r) => userRoles.includes(r));
  }

  private async isOwner(tenantId: string, userId: string): Promise<boolean> {
    const roles = await this.getUserRoles(tenantId, userId);
    return roles.includes(SYSTEM_ROLE.OWNER);
  }
}

export const rbacService = new RbacService();
