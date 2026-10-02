import { redis } from "@/config/redis.js";
import { logger } from "@/platform/logger/index.js";
import { PREF_CACHE_TTL } from "./constants.js";

const PREFIX = "notice-pref:";

export async function getPrefCache(tenantId: string, userId: string) {
  try {
    const raw = await redis.get(`${PREFIX}${tenantId}:${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    logger.warn({ err, tenantId, userId }, "[notice-pref] cache get failed");
    return null;
  }
}

export async function setPrefCache(
  tenantId: string,
  userId: string,
  data: unknown,
) {
  try {
    await redis.setex(
      `${PREFIX}${tenantId}:${userId}`,
      PREF_CACHE_TTL,
      JSON.stringify(data),
    );
  } catch (err) {
    logger.warn({ err, tenantId, userId }, "[notice-pref] cache set failed");
  }
}

export async function invalidatePrefCache(tenantId: string, userId: string) {
  try {
    await redis.del(`${PREFIX}${tenantId}:${userId}`);
  } catch (err) {
    logger.warn(
      { err, tenantId, userId },
      "[notice-pref] cache invalidate failed",
    );
  }
}

/** ⭐ 快速判断：查 Redis 缓存的允许列表 */
const ALLOW_PREFIX = "notice-pref:allow:";
const ALLOW_TTL = 120;

export async function getAllowCache(
  tenantId: string,
  channel: string,
  eventType: string,
): Promise<string[] | null> {
  try {
    const raw = await redis.get(
      `${ALLOW_PREFIX}${tenantId}:${channel}:${eventType}`,
    );
    return raw ? (JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

export async function setAllowCache(
  tenantId: string,
  channel: string,
  eventType: string,
  userIds: string[],
) {
  try {
    await redis.setex(
      `${ALLOW_PREFIX}${tenantId}:${channel}:${eventType}`,
      ALLOW_TTL,
      JSON.stringify(userIds),
    );
  } catch {}
}
