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
  /**
   * 查询用户是否处于注销申请中
   */
  async findUserWithCancelStatus(userId: string, tenantId: string) {
    return prisma.sys_user.findFirst({
      where: { user_id: userId, tenant_id: tenantId, is_deleted: 0 },
      select: {
        user_id: true,
        cancelled_at: true,
        cancel_effective: true,
      },
    });
  }

  /**
   * 提交注销申请
   */
  async submitCancel(
    userId: string,
    tenantId: string,
    reason: string | null,
    effectiveAt: Date,
  ) {
    return prisma.sys_user.update({
      where: { user_id: userId },
      data: {
        cancelled_at: new Date(),
        cancel_reason: reason,
        cancel_effective: effectiveAt,
        updated_at: new Date(),
      },
    });
  }

  /**
   * 撤销注销申请（登录时自动调用）
   */
  async revokeCancel(userId: string, tenantId: string) {
    return prisma.sys_user.update({
      where: { user_id: userId },
      data: {
        cancelled_at: null,
        cancel_reason: null,
        cancel_effective: null,
        updated_at: new Date(),
      },
    });
  }

  /**
   * 批量软删除到期注销的账号
   */
  async cleanExpiredCancelled(): Promise<number> {
    const result = await prisma.sys_user.updateMany({
      where: {
        cancelled_at: { not: null },
        cancel_effective: { lte: new Date() },
        is_deleted: 0,
      },
      data: {
        is_deleted: 1,
        updated_at: new Date(),
      },
    });
    return result.count;
  }
}
