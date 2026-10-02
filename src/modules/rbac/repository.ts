import { prisma } from "@/config/database.js";

export class RbacRepository {
  async findUserRoles(userId: string, tenantId: string) {
    return prisma.sys_user_role.findMany({
      where: { user_id: userId, tenant_id: tenantId },
      include: { role: { select: { role_code: true } } },
    });
  }

  async findUserRoleIds(userId: string, tenantId: string) {
    return prisma.sys_user_role.findMany({
      where: { user_id: userId, tenant_id: tenantId },
      select: { role_id: true },
    });
  }

  async findRolePermissions(roleIds: string[], tenantId: string) {
    return prisma.sys_role_permission.findMany({
      where: { role_id: { in: roleIds }, tenant_id: tenantId },
      select: { perm_id: true },
    });
  }

  async findPermissionCodes(permIds: string[]) {
    return prisma.sys_permission.findMany({
      where: { perm_id: { in: permIds }, status: "1", is_deleted: 0 },
      select: { perm_code: true },
    });
  }

  async findTenantCode(tenantId: string) {
    return prisma.sys_tenant.findUnique({
      where: { tenant_id: tenantId },
      select: { tenant_code: true },
    });
  }

  async findUserRolesWithCode(userId: string, tenantId: string) {
    return prisma.sys_user_role.findMany({
      where: { user_id: userId, tenant_id: tenantId },
      include: { role: { select: { role_code: true } } },
    });
  }

  /* ============================================================
   * ⭐ 新增：查询用户所属的所有用户组角色 ID
   * ============================================================ */
  async findUserGroupRoleIds(
    userId: string,
    tenantId: string,
  ): Promise<string[]> {
    const rows = await prisma.sys_user_group_role.findMany({
      where: {
        tenant_id: tenantId,
        group: {
          tenant_id: tenantId,
          is_deleted: 0,
          status: "1",
          members: {
            some: { user_id: userId, tenant_id: tenantId },
          },
        },
      },
      select: { role_id: true },
    });
    return [...new Set(rows.map((r) => r.role_id))];
  }

  /* ============================================================
   * ⭐ 新增：查询用户所属的所有用户组角色编码
   * 用于 auth.service.loadRoleCodes
   * ============================================================ */
  async findUserGroupRoleCodes(
    userId: string,
    tenantId: string,
  ): Promise<string[]> {
    const roleIds = await this.findUserGroupRoleIds(userId, tenantId);
    if (roleIds.length === 0) return [];

    const roles = await prisma.sys_role.findMany({
      where: {
        role_id: { in: roleIds },
        tenant_id: tenantId,
        is_deleted: 0,
        status: "1",
      },
      select: { role_code: true },
    });
    return [...new Set(roles.map((r) => r.role_code))];
  }
}
