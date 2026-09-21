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
}
