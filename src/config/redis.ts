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
 * 通用配置（主从/集群共用的基础选项）
 * ============================================================ */
const BASE_OPTIONS: RedisOptions = {
  // ── 连接 ──
  host: env.REDIS_HOST,
  port: Number(env.REDIS_PORT ?? 6379),
  password: env.REDIS_PASSWORD || undefined,
  db: Number(env.REDIS_DB ?? 0),

  // ── ⭐ 超时（关键修复）──
  connectTimeout: 10_000, // 建立连接超时
  commandTimeout: 30_000, // ⭐ 命令超时（默认无，必须显式设置）
  keepAlive: 30_000, // TCP keep-alive
  noDelay: true, // 禁用 Nagle

  // ── ⭐ 重连策略 ──
  retryStrategy(times) {
    // 指数退避，最大 30 秒
    const delay = Math.min(times * 500, 30_000);
    if (times % 10 === 0) {
      logger.warn({ times, delay }, "[redis] 重连中");
    }
    return delay;
  },
  maxRetriesPerRequest: 3, // ⭐ 每个命令最多重试 3 次
  enableReadyCheck: true, // 等待 READY 才认为连接可用
  enableOfflineQueue: true, // 离线时排队命令
  lazyConnect: false,

  // ── ⭐ 断线自动恢复 ──
  autoResubscribe: true,
  autoResendUnfulfilledCommands: true,

  // ── ⭐ 错误容忍 ──
  reconnectOnError(err) {
    const targetError = "READONLY";
    // 主从切换时重连
    if (err.message.includes(targetError)) return true;
    return 2; // 其它错误重连
  },
};

/* ============================================================
 * 主连接（读写）
 * ============================================================ */
export const redis = new Redis(redisUrl, {
  ...BASE_OPTIONS,
});

/* ============================================================
 * 订阅连接（Pub/Sub 专用，ioredis 要求独立连接）
 * ============================================================ */
export const subRedis = new Redis(redisUrl, {
  ...BASE_OPTIONS,
  // 订阅连接不设 commandTimeout（订阅是长连接，不应超时）
  commandTimeout: undefined,
});
// block connection
export const blockRedis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

/* ============================================================
 * BullMQ 专用连接（要求 maxRetriesPerRequest: null）
 * ============================================================ */
export function createBullConnection(name: string): Redis {
  const conn = new Redis({
    ...BASE_OPTIONS,
    maxRetriesPerRequest: null, // ⭐ BullMQ 要求
    enableReadyCheck: false,
    commandTimeout: undefined, // ⭐ BullMQ 的阻塞命令不应超时
    connectionName: `bull:${name}`,
  });

  attachListeners(conn, `bull:${name}`);
  return conn;
}

/* ============================================================
 * 统一事件监听
 * ============================================================ */
function attachListeners(client: Redis, tag: string) {
  client.on("connect", () => {
    logger.info({ tag }, "[redis] connected");
  });

  client.on("ready", () => {
    logger.info({ tag }, "[redis] ready");
  });

  client.on("error", (err) => {
    // ⭐ 不要 throw，避免进程崩溃；记日志即可
    logger.error({ err, tag }, "[redis] error");
  });

  client.on("close", () => {
    logger.warn({ tag }, "[redis] connection closed");
  });

  client.on("reconnecting", (delay: number) => {
    logger.warn({ tag, delay }, "[redis] reconnecting");
  });

  client.on("end", () => {
    logger.warn({ tag }, "[redis] connection ended");
  });
}

attachListeners(redis, "main");
attachListeners(subRedis, "sub");
attachListeners(blockRedis, "block");
/* ============================================================
 * 优雅退出
 * ============================================================ */
process.on("SIGTERM", async () => {
  try {
    await blockRedis.quit();
    await redis.quit();
    await subRedis.quit();
    logger.info("[redis] connections closed");
  } catch (err) {
    logger.warn({ err }, "[redis] close failed");
  }
});
