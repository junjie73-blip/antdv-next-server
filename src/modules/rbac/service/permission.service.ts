import { RbacRepository } from "../repository.js";
import { redis } from "@/config/redis.js";
import { logger } from "@/platform/logger/index.js";

const PERM_CACHE_TTL = 300;

const repo = new RbacRepository();

export async function getUserRoles(
  userId: string,
  tenantId: string,
): Promise<string[]> {
  const userRoles = await repo.findUserRoles(userId, tenantId);
  return userRoles.map((ur) => ur.role.role_code);
}

export async function getUserPermissions(
  userId: string,
  tenantId: string,
): Promise<string[]> {
  const cacheKey = `rbac:perms:${tenantId}:${userId}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached !== null) return JSON.parse(cached) as string[];
  } catch {}

  const userRoles = await repo.findUserRoleIds(userId, tenantId);
  const roleIds = userRoles.map((ur) => ur.role_id);

  if (roleIds.length === 0) {
    await safeSetCache(cacheKey, []);
    return [];
  }

  const rolePerms = await repo.findRolePermissions(roleIds, tenantId);
  const permIds = [...new Set(rolePerms.map((rp) => rp.perm_id))];

  const permissions = await repo.findPermissionCodes(permIds);
  const permCodes = permissions.map((p) => p.perm_code);

  await safeSetCache(cacheKey, permCodes);
  return permCodes;
}

async function safeSetCache(key: string, value: string[]): Promise<void> {
  try {
    await redis.setex(key, PERM_CACHE_TTL, JSON.stringify(value));
  } catch {}
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

/**
 * 便捷：检查 user 对象（来自 req.user）是否拥有指定权限数组中的任意一个
 * 用于 rbac 中间件 @RequirePermission
 */
export async function checkUserPermissions(
  user: { userId: string; tenantId: string },
  permissions: string[],
): Promise<boolean> {
  if (!user || !permissions || permissions.length === 0) return false;
  const perms = await getUserPermissions(user.userId, user.tenantId);
  return perms.includes("*") || permissions.some((p) => perms.includes(p));
}

export async function invalidateUserCache(
  userId: string,
  tenantId: string,
): Promise<void> {
  try {
    await redis.del(`rbac:perms:${tenantId}:${userId}`);
  } catch {}
  logger.debug({ userId, tenantId }, "RBAC cache invalidated");
}
