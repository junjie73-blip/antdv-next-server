import { Redis } from "ioredis";
import { logger } from "@/platform/logger/logger.js";
import { sendAlert } from "@/platform/alert/index.js";
import { env } from "@/config/env.js";

// ✅ env schema 已保证非空，无需 `|| ""`
const redisUrl = env.REDIS_URL;

if (!redisUrl) {
  // 理论上不可达，作为编译期保障
  throw new Error("[redis] REDIS_URL 未配置");
}

const baseOptions = {
  maxRetriesPerRequest: null,
  retryStrategy(times: number) {
    return Math.min(times * 200, 5000);
  },
  commandTimeout: 5000,
  keepAlive: 10000,
  enableOfflineQueue: true,
} as const;

export const redis = new Redis(redisUrl, baseOptions);

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

export const subRedis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});

subRedis.on("error", (err) => {
  logger.warn({ err }, "[subRedis] error");
});

export const blockRedis = new Redis(redisUrl, { maxRetriesPerRequest: null });

blockRedis.on("error", (err) => {
  logger.warn({ err }, "[blockRedis] error");
});

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
