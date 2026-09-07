import { Redis } from "@upstash/redis";

const redisUrl =
  process.env.antdv_REDIS_URL || process.env.antdv_KV_REST_API_URL || "";
const redisToken =
  process.env.antdv_REDIS_TOKEN || process.env.antdv_KV_REST_API_TOKEN || "";

export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});
// 用于订阅的独立客户端（避免阻塞其他操作）
export const subRedis = new Redis({
  url: redisUrl,
  token: redisToken,
});
export const SESSION_PREFIX = "session:";
export const CACHE_PREFIX = "cache:";
export const MFA_PREFIX = "mfa:";
export const RATE_LIMIT_PREFIX = "rate:";

export async function setSession(
  sessionId: string,
  data: any,
  ttl = 3600,
): Promise<void> {
  await redis.setex(`${SESSION_PREFIX}${sessionId}`, ttl, JSON.stringify(data));
}

export async function getSession<T>(sessionId: string): Promise<T | null> {
  const data = await redis.get(`${SESSION_PREFIX}${sessionId}`);
  return data ? (JSON.parse(data as string) as T) : null;
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
  return data ? (JSON.parse(data as string) as T) : null;
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
