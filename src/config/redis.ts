import { Redis } from "ioredis";
// 先加载 env，确保 dotenv 已执行
import "@/config/env.js";
import { logger } from "@/core/logger/logger.js";
import { sendAlert } from "@/core/alert/index.js";

const redisUrl = process.env.REDIS_URL || "";

if (!redisUrl) {
  console.warn(
    "[redis] REDIS_URL 未配置，Redis 相关功能（会话/缓存/限流/通知推送）将不可用",
  );
}

// 统一的连接选项
const baseOptions = {
  // 没配 URL 时不要疯狂重连打日志
  lazyConnect: !redisUrl,
  // 单条命令失败重试次数
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    if (!redisUrl) return null; // 未配置则不重连
    return Math.min(times * 200, 2000);
  },
  // Upstash 是远程服务，建议开启 keepAlive
  keepAlive: 10000,
} as const;

// ioredis 直接接受连接串；未配置时退化成一个永不连接的 lazy 客户端
export const redis = redisUrl
  ? new Redis(redisUrl, baseOptions)
  : new Redis({ lazyConnect: true, retryStrategy: () => null });
redis.on("error", (err) => {
  logger.error({ err }, "[redis] connection error");
  void sendAlert({
    level: "warning",
    title: "redis_error",
    message: "Redis 连接异常",
    source: "redis",
    data: { error: String(err?.message) },
  });
});
redis.on("ready", () => {
  logger.info("[redis] ready");
});
// 订阅需要独立连接（订阅会阻塞该连接）
export const subRedis = redisUrl
  ? new Redis(redisUrl, baseOptions)
  : new Redis({ lazyConnect: true, retryStrategy: () => null });

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

export async function scanAll(
  pattern: string,
  batchSize = 200,
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
  } while (cursor !== "0");
  return keys;
}
