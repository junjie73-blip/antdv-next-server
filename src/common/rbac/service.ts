import { prisma } from "@config/database.js";
import { getCache, setCache, deleteCache } from "@config/redis.js";
import { logger } from "@core/logger/index.js";

const PERM_CACHE_TTL = 300;

export async function getUserRoles(
  userId: string,
  tenantId: string,
): Promise<string[]> {
  const userRoles = await prisma.sys_user_role.findMany({
    where: { user_id: userId, tenant_id: tenantId },
    include: { role: { select: { role_code: true } } },
  });
  return userRoles.map((ur) => ur.role.role_code);
}

export async function getUserPermissions(
  userId: string,
  tenantId: string,
): Promise<string[]> {
  const cacheKey = `rbac:perms:${tenantId}:${userId}`;
  const cached = await getCache<string[]>(cacheKey);
  if (cached) return cached;

  const userRoles = await prisma.sys_user_role.findMany({
    where: { user_id: userId, tenant_id: tenantId },
    select: { role_id: true },
  });

  const roleIds = userRoles.map((ur) => ur.role_id);
  if (roleIds.length === 0) {
    await setCache(cacheKey, [], PERM_CACHE_TTL);
    return [];
  }

  const rolePerms = await prisma.sys_role_permission.findMany({
    where: { role_id: { in: roleIds }, tenant_id: tenantId },
    select: { perm_id: true },
  });

  const permIds = [...new Set(rolePerms.map((rp) => rp.perm_id))];

  const permissions = await prisma.sys_permission.findMany({
    where: { perm_id: { in: permIds }, status: "1", is_deleted: 0 },
    select: { perm_code: true },
  });

  const permCodes = permissions.map((p) => p.perm_code);
  await setCache(cacheKey, permCodes, PERM_CACHE_TTL);
  return permCodes;
}

export async function checkPermission(
  userId: string,
  tenantId: string,
  requiredPerm: string,
): Promise<boolean> {
  const perms = await getUserPermissions(userId, tenantId);
  return perms.includes(requiredPerm) || perms.includes("*");
}

export async function checkAllPermissions(
  userId: string,
  tenantId: string,
  requiredPerms: string[],
): Promise<boolean> {
  const perms = await getUserPermissions(userId, tenantId);
  if (perms.includes("*")) return true;
  return requiredPerms.every((p) => perms.includes(p));
}

export async function checkAnyPermission(
  userId: string,
  tenantId: string,
  requiredPerms: string[],
): Promise<boolean> {
  const perms = await getUserPermissions(userId, tenantId);
  if (perms.includes("*")) return true;
  return requiredPerms.some((p) => perms.includes(p));
}

export async function invalidateUserCache(
  userId: string,
  tenantId: string,
): Promise<void> {
  await deleteCache(`rbac:perms:${tenantId}:${userId}`);
  logger.debug({ userId, tenantId }, "RBAC cache invalidated");
}

export async function assignRoleToUser(
  userId: string,
  roleId: string,
  tenantId: string,
): Promise<void> {
  await prisma.sys_user_role.upsert({
    where: { user_id_role_id: { user_id: userId, role_id: roleId } },
    update: {},
    create: { user_id: userId, role_id: roleId, tenant_id: tenantId },
  });
  await invalidateUserCache(userId, tenantId);
}

export async function removeRoleFromUser(
  userId: string,
  roleId: string,
  tenantId: string,
): Promise<void> {
  await prisma.sys_user_role.deleteMany({
    where: { user_id: userId, role_id: roleId, tenant_id: tenantId },
  });
  await invalidateUserCache(userId, tenantId);
}
