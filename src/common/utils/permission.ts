import { prisma } from "@/config/database.js";

/**
 * 检查用户是否拥有指定权限（任一匹配即可）
 * @param user - 当前用户对象（至少包含 userId, tenantId）
 * @param permissions - 需要检查的权限编码数组，如 ['user:list', 'user:create']
 * @returns boolean
 */
export async function checkUserPermissions(
  user: { userId: string; tenantId: string },
  permissions: string[],
): Promise<boolean> {
  if (!user || !permissions || permissions.length === 0) return false;

  // 1. 获取用户关联的角色 ID 列表
  const userRoles = await prisma.sys_user_role.findMany({
    where: { user_id: user.userId, tenant_id: user.tenantId },
    select: { role_id: true },
  });

  if (userRoles.length === 0) return false;
  const roleIds = userRoles.map((ur) => ur.role_id);

  // 2. 获取角色关联的权限 ID 列表
  const rolePermissions = await prisma.sys_role_permission.findMany({
    where: { role_id: { in: roleIds }, tenant_id: user.tenantId },
    select: { perm_id: true },
  });

  if (rolePermissions.length === 0) return false;
  const permIds = rolePermissions.map((rp) => rp.perm_id);

  // 3. 获取这些权限的编码
  const perms = await prisma.sys_permission.findMany({
    where: { perm_id: { in: permIds }, tenant_id: user.tenantId, status: 1 },
    select: { perm_code: true },
  });

  const userPermCodes = new Set(perms.map((p) => p.perm_code));

  // 4. 检查是否拥有所需权限中的任意一个
  return permissions.some((p) => userPermCodes.has(p));
}
