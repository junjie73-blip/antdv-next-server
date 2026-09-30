import { prisma } from "../config/database.js";

export class RoleRepository {
  /** 查用户角色 code 列表 */
  async findUserRoleCodes(userId: string, tenantId: string): Promise<string[]> {
    const rows = await prisma.sys_user_role.findMany({
      where: { user_id: userId, tenant_id: tenantId },
      include: { role: { select: { role_code: true, is_deleted: true } } },
    });
    return rows
      .filter((r) => r.role && r.role.is_deleted === 0)
      .map((r) => r.role.role_code);
  }

  /** 查用户角色 ID */
  async findUserRoleIds(userId: string, tenantId: string): Promise<string[]> {
    const rows = await prisma.sys_user_role.findMany({
      where: { user_id: userId, tenant_id: tenantId },
      select: { role_id: true },
    });
    return rows.map((r) => r.role_id);
  }

  /** 根据角色 ID 查权限 code */
  async findPermCodesByRoleIds(
    roleIds: string[],
    tenantId: string,
  ): Promise<string[]> {
    if (roleIds.length === 0) return [];
    const rows = await prisma.sys_role_permission.findMany({
      where: { role_id: { in: roleIds }, tenant_id: tenantId },
      include: {
        perm: { select: { perm_code: true, status: true, is_deleted: true } },
      },
    });
    return rows
      .filter((r) => r.perm && r.perm.status === "1" && r.perm.is_deleted === 0)
      .map((r) => r.perm.perm_code);
  }
}
