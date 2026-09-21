import { Redis } from "ioredis";
import "@/config/env.js";
import { logger } from "@/platform/logger/logger.js";
import { sendAlert } from "@/platform/alert/index.js";
import { env } from "@/config/env.js";

const redisUrl = env.REDIS_URL || "";
if (!redisUrl) {
  console.warn("[redis] REDIS_URL 未配置，Redis 相关功能将不可用");
}

const baseOptions = {
  lazyConnect: !redisUrl,
  maxRetriesPerRequest: null,
  retryStrategy(times: number) {
    if (!redisUrl) return null;
    return Math.min(times * 200, 5000);
  },
  commandTimeout: 5000,
  keepAlive: 10000,
  enableOfflineQueue: true,
} as const;

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
redis.on("ready", () => logger.info("[redis] ready"));

export const subRedis = redisUrl
  ? new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    })
  : new Redis({ lazyConnect: true, retryStrategy: () => null });

export const blockRedis = redisUrl
  ? new Redis(env.REDIS_URL, { maxRetriesPerRequest: null })
  : new Redis({ lazyConnect: true, retryStrategy: () => null });

export function createBullConnection(name: string): Redis {
  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    connectTimeout: 10_000,
    keepAlive: 30_000,
    retryStrategy: (times) => {
      if (times > 20) return null;
      return Math.min(times * 200, 3000);
    },
  });
  client.on("error", (err) =>
    logger.error({ err, bullmq: name }, "bullmq redis error"),
  );
  client.on("ready", () => logger.info({ bullmq: name }, "bullmq redis ready"));
  return client;
}
