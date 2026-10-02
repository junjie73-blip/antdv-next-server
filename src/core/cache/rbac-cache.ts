import { redis } from "@/config/redis.js";
import { logger } from "@/platform/logger/index.js";

const PERM_PREFIX = "rbac:perms:";
const GROUP_ROLE_PREFIX = "user-group:role:";

export const RBAC_PERM_TTL = 300;
export const GROUP_ROLE_TTL = 300;

/* ============================================================
 * 权限码缓存
 * ============================================================ */
function permKey(tenantId: string, userId: string): string {
  return `${PERM_PREFIX}${tenantId}:${userId}`;
}

export async function getPermCache(
  tenantId: string,
  userId: string,
): Promise<string[] | null> {
  try {
    const v = await redis.get(permKey(tenantId, userId));
    return v === null ? null : (JSON.parse(v) as string[]);
  } catch (err) {
    logger.warn({ err, tenantId, userId }, "[rbac-cache] get perm failed");
    return null;
  }
}

export async function setPermCache(
  tenantId: string,
  userId: string,
  perms: string[],
): Promise<void> {
  try {
    await redis.setex(
      permKey(tenantId, userId),
      RBAC_PERM_TTL,
      JSON.stringify(perms),
    );
  } catch (err) {
    logger.warn({ err, tenantId, userId }, "[rbac-cache] set perm failed");
  }
}

export async function invalidateUserPermCache(
  tenantId: string,
  userIds: string[],
): Promise<void> {
  if (userIds.length === 0) return;
  try {
    const keys = userIds.map((uid) => permKey(tenantId, uid));
    await redis.del(...keys);
  } catch (err) {
    logger.warn({ err, tenantId }, "[rbac-cache] invalidate perm failed");
  }
}

/* ============================================================
 * 组角色缓存
 * ============================================================ */
function groupRoleKey(tenantId: string, userId: string): string {
  return `${GROUP_ROLE_PREFIX}${tenantId}:${userId}`;
}

export async function getGroupRoleCache(
  tenantId: string,
  userId: string,
): Promise<string[] | null> {
  try {
    const v = await redis.get(groupRoleKey(tenantId, userId));
    return v === null ? null : (JSON.parse(v) as string[]);
  } catch (err) {
    logger.warn(
      { err, tenantId, userId },
      "[rbac-cache] get group role failed",
    );
    return null;
  }
}

export async function setGroupRoleCache(
  tenantId: string,
  userId: string,
  roleCodes: string[],
): Promise<void> {
  try {
    await redis.setex(
      groupRoleKey(tenantId, userId),
      GROUP_ROLE_TTL,
      JSON.stringify(roleCodes),
    );
  } catch (err) {
    logger.warn(
      { err, tenantId, userId },
      "[rbac-cache] set group role failed",
    );
  }
}

export async function invalidateGroupRoleCache(
  tenantId: string,
  userIds: string[],
): Promise<void> {
  if (userIds.length === 0) return;
  try {
    const keys = userIds.map((uid) => groupRoleKey(tenantId, uid));
    await redis.del(...keys);
  } catch (err) {
    logger.warn({ err, tenantId }, "[rbac-cache] invalidate group role failed");
  }
}

/* ============================================================
 * 一次性失效（权限 + 组角色）
 * 用于：用户组变更后
 * ============================================================ */
export async function invalidateAllUserCaches(
  tenantId: string,
  userIds: string[],
): Promise<void> {
  if (userIds.length === 0) return;
  await Promise.all([
    invalidateUserPermCache(tenantId, userIds),
    invalidateGroupRoleCache(tenantId, userIds),
  ]);
}
