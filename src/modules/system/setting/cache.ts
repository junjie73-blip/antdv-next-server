import { redis } from "@/config/redis.js";
import { subRedis } from "@/config/redis.js";
import { delChunked } from "@/core/index.js";
import { logger } from "@/platform/logger/index.js";

const CACHE_PREFIX = "config:";
const CACHE_TTL = 600; // 10 分钟兜底
const RELOAD_CHANNEL = "config:reload";

/* ============================================================
 * 内存 L1 缓存（进程级）
 * ============================================================ */
const localCache = new Map<
  string,
  { value: string | null; expireAt: number }
>();
const LOCAL_TTL = 60_000;

/* ============================================================
 * 读缓存
 * ============================================================ */
export async function getCached(
  tenantId: string,
  key: string,
): Promise<string | null | undefined> {
  // 1. L1
  const localKey = `${tenantId}:${key}`;
  const local = localCache.get(localKey);
  if (local && local.expireAt > Date.now()) {
    return local.value;
  }

  // 2. L2 Redis
  try {
    const redisKey = `${CACHE_PREFIX}${tenantId}:${key}`;
    const value = await redis.get(redisKey);
    if (value !== null) {
      localCache.set(localKey, { value, expireAt: Date.now() + LOCAL_TTL });
      return value;
    }
  } catch (err) {
    logger.warn({ err }, "[config] redis get failed");
  }

  return undefined; // 缓存未命中
}

/* ============================================================
 * 写缓存
 * ============================================================ */
export async function setCached(
  tenantId: string,
  key: string,
  value: string | null,
): Promise<void> {
  const localKey = `${tenantId}:${key}`;
  localCache.set(localKey, { value, expireAt: Date.now() + LOCAL_TTL });

  try {
    const redisKey = `${CACHE_PREFIX}${tenantId}:${key}`;
    if (value === null) {
      await redis.del(redisKey);
    } else {
      await redis.setex(redisKey, CACHE_TTL, value);
    }
  } catch (err) {
    logger.warn({ err }, "[config] redis set failed");
  }
}

/* ============================================================
 * 失效单 key
 * ============================================================ */
export async function invalidate(tenantId: string, key: string): Promise<void> {
  localCache.delete(`${tenantId}:${key}`);
  try {
    await redis.del(`${CACHE_PREFIX}${tenantId}:${key}`);
  } catch (err) {
    logger.warn({ err }, "[config] redis del failed");
  }
}

/**
 * ⭐ 批量失效 + 广播（跨实例）
 */
export async function invalidateAndBroadcast(
  tenantId: string,
  keys: string[],
): Promise<void> {
  if (keys.length === 0) return;

  // 清本地
  for (const k of keys) localCache.delete(`${tenantId}:${k}`);

  // 清 Redis
  try {
    const redisKeys = keys.map((k) => `${CACHE_PREFIX}${tenantId}:${k}`);
    if (redisKeys.length > 0) {
      await delChunked(redisKeys);
    }
  } catch (err) {
    logger.warn({ err }, "[config] redis batch del failed");
  }

  // 广播到其他实例
  try {
    await redis.publish(RELOAD_CHANNEL, JSON.stringify({ tenantId, keys }));
    logger.debug({ tenantId, count: keys.length }, "[config] reload broadcast");
  } catch (err) {
    logger.warn({ err }, "[config] broadcast failed");
  }
}

/* ============================================================
 * 订阅广播
 * ============================================================ */
let subscriberStarted = false;

export function startConfigSubscriber(): void {
  if (subscriberStarted) {
    logger.debug("[config] subscriber already started, skip");
    return;
  }
  subscriberStarted = true;

  void subRedis.subscribe(RELOAD_CHANNEL);
  subRedis.on("message", (channel, message) => {
    if (channel !== RELOAD_CHANNEL) return;
    try {
      const { tenantId, keys } = JSON.parse(message) as {
        tenantId: string;
        keys: string[];
      };
      if (!Array.isArray(keys)) return;
      for (const k of keys) localCache.delete(`${tenantId}:${k}`);
      logger.debug(
        { tenantId, count: keys.length },
        "[config] local cache cleared",
      );
    } catch (err) {
      logger.warn({ err }, "[config] reload parse failed");
    }
  });
  logger.info("[config] subscriber started");
}
