import { prisma } from "@/config/database.js";
import { rbacCache } from "./cache.js";
import { SYSTEM_ROLE } from "./constants.js";

export class RbacService {
  async getUserPermissions(
    tenantId: string,
    userId: string,
  ): Promise<string[]> {
    const cached = await rbacCache.getPermissions(tenantId, userId);
    if (cached) return cached;

    const userRoles = await prisma.sys_user_role.findMany({
      where: { user_id: userId, tenant_id: tenantId },
    });
    const roleIds = userRoles.map((ur) => ur.role_id);

    const rolePermissions = await prisma.sys_role_permission.findMany({
      where: { role_id: { in: roleIds } },
    });
    const permIds = rolePermissions.map((rp) => rp.perm_id);

    const permissions = await prisma.sys_permission.findMany({
      where: { perm_id: { in: permIds } },
    });

    const permSet = new Set(permissions.map((p) => p.perm_code));
    const result = Array.from(permSet);
    await rbacCache.setPermissions(tenantId, userId, result);
    return result;
  }

  async getUserRoles(tenantId: string, userId: string): Promise<string[]> {
    const cached = await rbacCache.getRoles(tenantId, userId);
    if (cached) return cached;

    const userRoles = await prisma.sys_user_role.findMany({
      where: { user_id: userId, tenant_id: tenantId },
    });
    const roleIds = userRoles.map((ur) => ur.role_id);

    const roles = await prisma.sys_role.findMany({
      where: { role_id: { in: roleIds } },
    });

    const result = roles.map((r) => r.role_code);
    await rbacCache.setRoles(tenantId, userId, result);
    return result;
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
