import { Redis, RedisOptions } from "ioredis";
import { logger } from "@/platform/logger/logger.js";
import { sendAlert } from "@/platform/alert/index.js";
import { env } from "@/config/env.js";

// ✅ env schema 已保证非空，无需 `|| ""`
const redisUrl = env.REDIS_URL;

if (!redisUrl) {
  // 理论上不可达，作为编译期保障
  throw new Error("[redis] REDIS_URL 未配置");
}

/* ============================================================
 * 基础连接配置
 * ============================================================ */
const baseOptions: RedisOptions = {
  host: env.REDIS_HOST,
  port: Number(env.REDIS_PORT) || 6379,
  password: env.REDIS_PASSWORD || undefined,
  db: Number(env.REDIS_DB) || 0,

  // ⭐ 连接超时：10 秒
  connectTimeout: 10_000,

  // ⭐ 命令超时：5 秒（普通命令）
  //    过长会导致请求堆积，过短会误杀慢命令
  commandTimeout: 5_000,

  // ⭐ TCP 保活
  keepAlive: 10_000,

  // ⭐ 就绪检查：Redis 未 ready 时不发命令
  enableReadyCheck: true,

  // ⭐ 命令重试：3 次（避免雪崩）
  maxRetriesPerRequest: 3,

  // ⭐ 重连策略
  retryStrategy: (times) => {
    if (times > 20) {
      logger.error({ times }, "[redis] retry exhausted, giving up");
      return null; // 停止重连
    }
    const delay = Math.min(times * 200, 3_000);
    if (times % 5 === 0) {
      logger.warn({ times, delay }, "[redis] reconnecting...");
    }
    return delay;
  },

  // ⭐ 断线时是否排队命令
  //    true：短时间断线可恢复
  //    false：断线立即失败
  enableOfflineQueue: true,

  // ⭐ 惰性连接：避免启动时阻塞
  lazyConnect: false,
};

/* ============================================================
 * 主连接（业务用）
 * ============================================================ */
export const redis = new Redis(baseOptions);

redis.on("connect", () => logger.info("[redis] connected"));
redis.on("ready", () => logger.info("[redis] ready"));
redis.on("error", (err) => logger.error({ err }, "[redis] error"));
redis.on("close", () => logger.warn("[redis] connection closed"));
redis.on("reconnecting", (delay: number) =>
  logger.warn({ delay }, "[redis] reconnecting"),
);
redis.on("end", () => logger.error("[redis] connection ended"));

/* ============================================================
 * 订阅专用连接（pub/sub 必须独立连接）
 * ============================================================ */
export const subRedis = new Redis({
  ...baseOptions,
  // ⭐ 订阅连接不能设置 commandTimeout，因为 SUBSCRIBE 是长阻塞命令
  commandTimeout: undefined,
  maxRetriesPerRequest: null,
});

subRedis.on("connect", () => logger.info("[redis:sub] connected"));
subRedis.on("error", (err) => logger.error({ err }, "[redis:sub] error"));

/* ============================================================
 * BullMQ 专用连接（必须禁用超时和重试限制）
 * ============================================================ */
export function createBullConnection(name: string): Redis {
  const conn = new Redis({
    ...baseOptions,
    // ⭐ BullMQ 用的是阻塞命令（BRPOPLPUSH 等）
    //    不能设置 commandTimeout，否则会误杀
    commandTimeout: undefined,
    // ⭐ BullMQ 要求
    maxRetriesPerRequest: null,
    // ⭐ BullMQ 要求
    enableReadyCheck: false,
  });

  conn.on("connect", () =>
    logger.info({ name }, `[redis:bull:${name}] connected`),
  );
  conn.on("error", (err) =>
    logger.error({ err, name }, `[redis:bull:${name}] error`),
  );

  return conn;
}

/* ============================================================
 * 健康检查
 * ============================================================ */
export async function pingRedis(): Promise<boolean> {
  try {
    const pong = await redis.ping();
    return pong === "PONG";
  } catch (err) {
    logger.error({ err }, "[redis] ping failed");
    return false;
  }
}

/* ============================================================
 * 优雅关闭
 * ============================================================ */
export async function closeRedis(): Promise<void> {
  try {
    await Promise.all([redis.quit(), subRedis.quit()]);
    logger.info("[redis] connections closed");
  } catch (err) {
    logger.error({ err }, "[redis] close failed");
  }
}

export const blockRedis = new Redis(redisUrl, { maxRetriesPerRequest: null });
process.on("SIGTERM", () => void closeRedis());
process.on("SIGINT", () => void closeRedis());
