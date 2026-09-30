import { redis, subRedis } from "@/config/redis.js";
import { delChunked } from "@/core/cache/redis-client.js";
import { logger } from "@/platform/logger/index.js";

const CACHE_PREFIX = "config:";
const CACHE_TTL = 600;
const RELOAD_CHANNEL = "config:reload";

/* ========== L1 内存缓存 ========== */
const localCache = new Map<
  string,
  { value: string | null; expireAt: number }
>();
const LOCAL_TTL = 60_000;

let subscriberStarted = false;

export async function getCached(
  tenantId: string,
  key: string,
): Promise<string | null | undefined> {
  const localKey = `${tenantId}:${key}`;
  const local = localCache.get(localKey);
  if (local && local.expireAt > Date.now()) {
    return local.value;
  }

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

  return undefined;
}

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

export async function invalidate(tenantId: string, key: string): Promise<void> {
  localCache.delete(`${tenantId}:${key}`);
  try {
    await redis.del(`${CACHE_PREFIX}${tenantId}:${key}`);
  } catch (err) {
    logger.warn({ err }, "[config] redis del failed");
  }
}

/**
 * ✅ 批量失效 + 广播（跨实例）
 * 使用 delChunked 避免 UNLINK/DEL 参数上限
 */
export async function invalidateAndBroadcast(
  tenantId: string,
  keys: string[],
): Promise<void> {
  if (!Array.isArray(keys) || keys.length === 0) return;

  // 1) 清 L1
  for (const k of keys) {
    localCache.delete(`${tenantId}:${k}`);
  }

  // 2) 清 Redis L2（分块删除）
  try {
    const redisKeys = keys.map((k) => `${CACHE_PREFIX}${tenantId}:${k}`);
    if (redisKeys.length > 0) {
      await delChunked(redisKeys); // ✅
    }
  } catch (err) {
    logger.warn({ err }, "[config] redis batch del failed");
  }

  // 3) 广播到其他实例
  try {
    await redis.publish(RELOAD_CHANNEL, JSON.stringify({ tenantId, keys }));
    logger.debug({ tenantId, count: keys.length }, "[config] reload broadcast");
  } catch (err) {
    logger.warn({ err }, "[config] broadcast failed");
  }
}

/* ============================================================
 * 订阅广播（防重复启动）
 * ============================================================ */
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
      if (!tenantId || !Array.isArray(keys)) return;
      for (const k of keys) localCache.delete(`${tenantId}:${k}`);
      logger.debug(
        { tenantId, count: keys.length },
        "[config] local cache cleared",
      );
    } catch (err) {
      logger.warn({ err, message }, "[config] reload parse failed");
    }
  });
  subRedis.on("error", (err) =>
    logger.error({ err }, "[config] subRedis error"),
  );
  logger.info("[config] subscriber started");
}
