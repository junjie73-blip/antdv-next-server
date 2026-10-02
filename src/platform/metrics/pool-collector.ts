import type { Pool } from "pg";
import type { Redis } from "ioredis";
import { logger } from "@/platform/logger/index.js";
import {
  dbPoolConnections,
  dbPoolSaturation,
  dbPoolErrorsTotal,
  redisClientStatus,
  redisClientErrorsTotal,
  redisClientReconnectsTotal,
  redisCommandDuration,
  redisCommandErrorsTotal,
  redisServerInfo,
  redisServerKeysTotal,
  redisServerHitRate,
} from "./pool.js";

const DB_SAMPLE_MS = 5_000;
const REDIS_INFO_SAMPLE_MS = 15_000;
const DB_SATURATION_WARN = 0.8;
const DB_WAITING_WARN = 5;
const attachedPools = new WeakSet<Pool>();
const attachedClients = new WeakSet<Redis>();
const REDIS_STATUSES = [
  "connecting",
  "connect",
  "ready",
  "close",
  "reconnecting",
  "end",
] as const;
type RedisStatus = (typeof REDIS_STATUSES)[number];

/* ============================================================
 * 数据库连接池采集
 * ============================================================ */
export function attachDbPoolMetrics(pool: Pool): () => void {
  if (attachedPools.has(pool)) {
    return () => {}; // 已挂载，noop
  }
  attachedPools.add(pool);
  const onError = (err: Error) => {
    dbPoolErrorsTotal.labels("pool_error").inc();
    logger.error({ err }, "[db-pool] error");
  };
  pool.on("error", onError);

  const timer = setInterval(() => {
    try {
      const total = pool.totalCount;
      const idle = pool.idleCount;
      const active = total - idle;
      const waiting = pool.waitingCount;
      const max = (pool as any).options?.max ?? total;

      dbPoolConnections.labels("total").set(total);
      dbPoolConnections.labels("idle").set(idle);
      dbPoolConnections.labels("active").set(active);
      dbPoolConnections.labels("waiting").set(waiting);

      const saturation = max > 0 ? active / max : 0;
      dbPoolSaturation.set(saturation);

      if (saturation >= DB_SATURATION_WARN) {
        logger.warn(
          { active, idle, waiting, max, saturation: +saturation.toFixed(2) },
          "[db-pool] high saturation",
        );
      }
      if (waiting >= DB_WAITING_WARN) {
        logger.warn(
          { waiting, active, idle, max },
          "[db-pool] requests waiting for connection",
        );
      }
    } catch (err) {
      logger.debug({ err }, "[db-pool] sample failed");
    }
  }, DB_SAMPLE_MS);
  timer.unref();

  return () => {
    clearInterval(timer);
    pool.off("error", onError);
  };
}

/* ============================================================
 * Redis 客户端采集
 * ============================================================ */
export interface RedisClientConfig {
  name: string;
  client: Redis;
  /** 是否开启命令级耗时/错误统计（默认关闭，避免性能开销） */
  instrumentCommands?: boolean;
}

export function attachRedisMetrics(clients: RedisClientConfig[]): () => void {
  const cleanups: Array<() => void> = [];

  for (const { name, client, instrumentCommands } of clients) {
    if (attachedClients.has(client)) continue; // 已挂载，noop
    attachedClients.add(client);
    const updateStatus = () => {
      const current = client.status as RedisStatus;
      for (const s of REDIS_STATUSES) {
        redisClientStatus.labels(name, s).set(s === current ? 1 : 0);
      }
    };
    updateStatus();

    const onStateChange = () => updateStatus();
    const onReconnecting = (delay: number) => {
      updateStatus();
      redisClientReconnectsTotal.labels(name).inc();
      logger.warn({ client: name, delay }, "[redis] reconnecting");
    };
    const onError = () => {
      redisClientErrorsTotal.labels(name).inc();
    };

    client.on("connect", onStateChange);
    client.on("ready", onStateChange);
    client.on("close", onStateChange);
    client.on("end", onStateChange);
    client.on("reconnecting", onReconnecting);
    client.on("error", onError);

    cleanups.push(() => {
      client.off("connect", onStateChange);
      client.off("ready", onStateChange);
      client.off("close", onStateChange);
      client.off("end", onStateChange);
      client.off("reconnecting", onReconnecting);
      client.off("error", onError);
    });

    /* 命令级指标（可选）—— ioredis 的 sendCommand 是统一入口 */
    if (instrumentCommands) {
      const originalSendCommand = client.sendCommand.bind(client);
      (client as any).sendCommand = async (command: any) => {
        const cmdName = (command?.name ?? "unknown").toString().toLowerCase();
        const start = process.hrtime.bigint();
        try {
          return await (originalSendCommand as any)(command);
        } catch (err) {
          redisCommandErrorsTotal.labels(name, cmdName).inc();
          throw err;
        } finally {
          const seconds = Number(process.hrtime.bigint() - start) / 1e9;
          redisCommandDuration.labels(name, cmdName).observe(seconds);
        }
      };
      cleanups.push(() => {
        (client as any).sendCommand = originalSendCommand;
      });
    }
  }

  /* Redis Server INFO 采样：只对主连接做，避免重复负担 */
  const mainClient = clients.find((c) => c.name === "main")?.client;
  let timer: NodeJS.Timeout | null = null;
  if (mainClient) {
    timer = setInterval(() => {
      if (mainClient.status !== "ready") return;
      void collectRedisServerInfo(mainClient);
    }, REDIS_INFO_SAMPLE_MS);
    timer.unref();
    cleanups.push(() => {
      if (timer) clearInterval(timer);
    });
  }

  return () => {
    for (const fn of cleanups) fn();
  };
}

/* ============================================================
 * INFO 采集
 * ============================================================ */
const INFO_KEYS = [
  "connected_clients",
  "used_memory",
  "used_memory_rss",
  "used_memory_peak",
  "total_commands_processed",
  "instantaneous_ops_per_sec",
  "keyspace_hits",
  "keyspace_misses",
  "expired_keys",
  "evicted_keys",
  "uptime_in_seconds",
  "total_connections_received",
] as const;

async function collectRedisServerInfo(client: Redis): Promise<void> {
  try {
    const text = await client.info();
    const parsed = parseRedisInfo(text);

    for (const key of INFO_KEYS) {
      const raw = parsed[key];
      if (raw === undefined) continue;
      const value = Number(raw);
      if (!Number.isFinite(value)) continue;
      redisServerInfo.labels(key).set(value);
    }

    const hits = Number(parsed["keyspace_hits"] ?? 0);
    const misses = Number(parsed["keyspace_misses"] ?? 0);
    const total = hits + misses;
    redisServerHitRate.set(total > 0 ? hits / total : 0);

    const keys = await client.dbsize();
    redisServerKeysTotal.set(keys);
  } catch (err) {
    logger.debug({ err }, "[redis] info sample failed");
  }
}

function parseRedisInfo(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return out;
}
