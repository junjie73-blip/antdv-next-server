import { redis, subRedis } from "@/config/redis.js";
import { SCAN_MAX_KEYS } from "@/config/constants.js";

export const SESSION_PREFIX = "session:";
export const CACHE_PREFIX = "cache:";
export const MFA_PREFIX = "mfa:";
export const RATE_LIMIT_PREFIX = "rate-limit:";

export async function setSession(
  sessionId: string,
  data: any,
  ttl = 3600,
): Promise<void> {
  await redis.setex(`${SESSION_PREFIX}${sessionId}`, ttl, JSON.stringify(data));
}

export async function getSession<T>(sessionId: string): Promise<T | null> {
  const data = await redis.get(`${SESSION_PREFIX}${sessionId}`);
  return data ? (JSON.parse(data) as T) : null;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await redis.del(`${SESSION_PREFIX}${sessionId}`);
}

export async function setCache<T>(
  key: string,
  data: T,
  ttl = 3000,
): Promise<void> {
  await redis.setex(`${CACHE_PREFIX}${key}`, ttl, JSON.stringify(data));
}

export async function getCache<T>(key: string): Promise<T | null> {
  const data = await redis.get(`${CACHE_PREFIX}${key}`);
  return data ? (JSON.parse(data) as T) : null;
}

export async function deleteCache(key: string): Promise<void> {
  await redis.del(`${CACHE_PREFIX}${key}`);
}

export function parseExpirationToSeconds(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 900;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 3600;
    case "d":
      return value * 86400;
    default:
      return 900;
  }
}

/** SCAN（带上限保护） */
export async function scanAll(
  pattern: string,
  batchSize = 200,
  maxKeys = SCAN_MAX_KEYS,
): Promise<string[]> {
  const keys: string[] = [];
  let cursor = "0";
  do {
    const [next, batch] = await redis.scan(
      cursor,
      "MATCH",
      pattern,
      "COUNT",
      batchSize,
    );
    cursor = next;
    keys.push(...batch);
    if (keys.length >= maxKeys) break;
  } while (cursor !== "0");
  return keys;
}

/** 批量删除（分块，避免 redis 参数过多） */
export async function delChunked(
  keys: string[],
  chunkSize = 500,
): Promise<number> {
  let total = 0;
  for (let i = 0; i < keys.length; i += chunkSize) {
    const chunk = keys.slice(i, i + chunkSize);
    if (chunk.length) total += await redis.del(...chunk);
  }
  return total;
}

export { redis, subRedis };
