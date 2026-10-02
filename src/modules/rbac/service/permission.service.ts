// modules/rbac/permission.service.ts
import { RbacRepository } from "../repository.js";
import { logger } from "@/platform/logger/index.js";
import {
  getPermCache,
  setPermCache,
  invalidateUserPermCache,
} from "@/core/cache/rbac-cache.js";

const repo = new RbacRepository();

/* ============================================================
 * 用户角色（直接 + 组，去重）
 * ============================================================ */
export async function getUserRoles(
  userId: string,
  tenantId: string,
): Promise<string[]> {
  const [direct, fromGroup] = await Promise.all([
    repo.findUserRolesWithCode(userId, tenantId),
    repo.findUserGroupRoleCodes(userId, tenantId),
  ]);

  return [...new Set([...direct.map((ur) => ur.role.role_code), ...fromGroup])];
}

/* ============================================================
 * 用户权限码（直接角色 ∪ 组角色 → 权限）
 * 缓存 key: rbac:perms:{tenantId}:{userId}
 * ============================================================ */
export async function getUserPermissions(
  userId: string,
  tenantId: string,
): Promise<string[]> {
  // 1. 缓存命中
  const cached = await getPermCache(tenantId, userId);
  if (cached !== null) return cached;

  // 2. ⭐ 合并直接角色 + 组角色
  const [userRoles, groupRoleIds] = await Promise.all([
    repo.findUserRoleIds(userId, tenantId),
    repo.findUserGroupRoleIds(userId, tenantId),
  ]);

  const roleIds = [
    ...new Set([...userRoles.map((ur) => ur.role_id), ...groupRoleIds]),
  ];

  if (roleIds.length === 0) {
    await setPermCache(tenantId, userId, []);
    return [];
  }

  // 3. 查角色权限
  const rolePerms = await repo.findRolePermissions(roleIds, tenantId);
  const permIds = [...new Set(rolePerms.map((rp) => rp.perm_id))];

  if (permIds.length === 0) {
    await setPermCache(tenantId, userId, []);
    return [];
  }

  const permissions = await repo.findPermissionCodes(permIds);
  const permCodes = permissions.map((p) => p.perm_code);

  await setPermCache(tenantId, userId, permCodes);
  return permCodes;
}

/* ============================================================
 * 单项校验
 * ============================================================ */
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
 * 中间件便捷方法
 */
export async function checkUserPermissions(
  user: { userId: string; tenantId: string },
  permissions: string[],
): Promise<boolean> {
  if (!user || !permissions || permissions.length === 0) return false;
  const perms = await getUserPermissions(user.userId, user.tenantId);
  return perms.includes("*") || permissions.some((p) => perms.includes(p));
}

/* ============================================================
 * ⭐ 缓存失效（单用户）
 * ============================================================ */
export async function invalidateUserCache(
  userId: string,
  tenantId: string,
): Promise<void> {
  await invalidateUserPermCache(tenantId, [userId]);
  logger.debug({ userId, tenantId }, "[rbac] perm cache invalidated");
}

/* ============================================================
 * ⭐ 批量失效（用户组变更时使用）
 * ============================================================ */
export async function invalidateUsersCache(
  userIds: string[],
  tenantId: string,
): Promise<void> {
  await invalidateUserPermCache(tenantId, userIds);
  logger.debug(
    { count: userIds.length, tenantId },
    "[rbac] perm cache batch invalidated",
  );
}
