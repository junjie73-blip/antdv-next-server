import { subRedis, redis } from "@/config/redis.js";
import { scanAll, delChunked } from "@/core/cache/redis-client.js";
import { wsManager } from "./manager.js";
import { logger } from "@/platform/logger/index.js";
import { LRUCache } from "lru-cache";

const FORCE_LOGOUT_CHANNEL = "user:force-logout";
const KICKED_KEY_TTL = 7 * 24 * 3600;
const NEGATIVE_CACHE_TTL = 1000;

const kickedNegCache = new LRUCache<string, boolean>({
  max: 10_000,
  ttl: NEGATIVE_CACHE_TTL,
});

export interface ForceLogoutPayload {
  userId: string;
  reason?: string;
  operatorId?: string;
  at?: number;
}

export interface KickedFlag {
  reason: string;
  at: number;
}

export async function kickUser(
  userId: string,
  options: { reason?: string; operatorId?: string } = {},
): Promise<void> {
  const { reason = "您已被管理员强制下线", operatorId } = options;

  const sessionKeys = [
    ...(await scanAll(`access:*:${userId}:*`)),
    ...(await scanAll(`refresh:*:${userId}:*`)),
  ];
  if (sessionKeys.length) {
    await delChunked(sessionKeys);
    logger.info(
      { userId, count: sessionKeys.length },
      "[kick] sessions cleared",
    );
  }

  const flag: KickedFlag = { reason, at: Date.now() };
  await redis.setex(`kicked:${userId}`, KICKED_KEY_TTL, JSON.stringify(flag));

  kickedNegCache.delete(userId);

  const payload: ForceLogoutPayload = {
    userId,
    reason,
    operatorId,
    at: flag.at,
  };
  await redis.publish(FORCE_LOGOUT_CHANNEL, JSON.stringify(payload));
  logger.info({ userId, operatorId }, "[kick] force-logout published");
}

export async function clearKickedFlag(userId: string): Promise<void> {
  await redis.del(`kicked:${userId}`);
  kickedNegCache.delete(userId);
}

export async function getKickedFlag(
  userId: string,
): Promise<KickedFlag | null> {
  const raw = await redis.get(`kicked:${userId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as KickedFlag;
  } catch {
    return { reason: "您已被强制下线", at: Date.now() };
  }
}

export async function getKickedFlagCached(
  userId: string,
): Promise<KickedFlag | null> {
  if (kickedNegCache.get(userId) === false) return null;

  const flag = await getKickedFlag(userId);
  if (!flag) {
    kickedNegCache.set(userId, false);
    return null;
  }
  kickedNegCache.delete(userId);
  return flag;
}

export async function startForceLogoutSubscriber(): Promise<void> {
  try {
    await subRedis.subscribe(FORCE_LOGOUT_CHANNEL);

    subRedis.on("message", (channel: string, message: string) => {
      if (channel !== FORCE_LOGOUT_CHANNEL) return;
      try {
        const data = JSON.parse(message) as ForceLogoutPayload;

        kickedNegCache.delete(data.userId);

        wsManager.sendToUsers([data.userId], {
          type: "force-logout",
          data: { reason: data.reason, at: data.at },
          timestamp: Date.now(),
        });
        logger.info({ userId: data.userId }, "[kick] pushed to WS");
      } catch (err) {
        logger.error({ err, message }, "Failed to handle force-logout message");
      }
    });

    subRedis.on("error", (err) =>
      logger.error({ err }, "Force-logout subscriber error"),
    );

    logger.info(`Subscribed to Redis channel: ${FORCE_LOGOUT_CHANNEL}`);
  } catch (err) {
    logger.error({ err }, "Failed to subscribe to force-logout channel");
  }
}
