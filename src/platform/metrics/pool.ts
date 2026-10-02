import { Counter, Gauge, Histogram, type Metric } from "prom-client";
import { register } from "./registry.js";

/* ============================================================
 * 幂等注册工具
 * ------------------------------------------------------------
 * prom-client 的 register 是全局单例。在 watch / 多入口 /
 * 路径混用场景下，同一指标模块可能被 eval 多次，直接 new
 * 会抛 "already registered"。这里统一用 getSingleMetric
 * 先查缓存，命中则直接复用，避免重复注册。
 * ============================================================ */
function registerGauge<L extends string>(
  name: string,
  help: string,
  labelNames: readonly L[] = [] as unknown as readonly L[],
): Gauge<L> {
  const existing = register.getSingleMetric(name);
  if (existing) return existing as Gauge<L>;
  return new Gauge<L>({
    name,
    help,
    labelNames: labelNames as unknown as L[],
    registers: [register],
  });
}

function registerCounter<L extends string>(
  name: string,
  help: string,
  labelNames: readonly L[] = [] as unknown as readonly L[],
): Counter<L> {
  const existing = register.getSingleMetric(name);
  if (existing) return existing as Counter<L>;
  return new Counter<L>({
    name,
    help,
    labelNames: labelNames as unknown as L[],
    registers: [register],
  });
}

function registerHistogram<L extends string>(
  name: string,
  help: string,
  labelNames: readonly L[] = [] as unknown as readonly L[],
  buckets?: number[],
): Histogram<L> {
  const existing = register.getSingleMetric(name);
  if (existing) return existing as Histogram<L>;
  return new Histogram<L>({
    name,
    help,
    labelNames: labelNames as unknown as L[],
    buckets,
    registers: [register],
  });
}

/* ============================================================
 * 数据库连接池
 * ============================================================ */
export const dbPoolConnections = registerGauge(
  "db_pool_connections",
  "Database connection pool connections by state",
  ["state"] as const,
);

export const dbPoolSaturation = registerGauge(
  "db_pool_saturation",
  "Database pool saturation (active / max), 0-1",
);

export const dbPoolErrorsTotal = registerCounter(
  "db_pool_errors_total",
  "Database pool errors",
  ["type"] as const,
);

/* ============================================================
 * Redis 客户端状态
 * ============================================================ */
export const redisClientStatus = registerGauge(
  "redis_client_status",
  "Redis client status (1 = current state)",
  ["client", "status"] as const,
);

export const redisClientErrorsTotal = registerCounter(
  "redis_client_errors_total",
  "Redis client errors",
  ["client"] as const,
);

export const redisClientReconnectsTotal = registerCounter(
  "redis_client_reconnects_total",
  "Redis client reconnection attempts",
  ["client"] as const,
);

/* ============================================================
 * Redis 命令（可选开启）
 * ============================================================ */
export const redisCommandDuration = registerHistogram(
  "redis_command_duration_seconds",
  "Redis command duration",
  ["client", "command"] as const,
  [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
);

export const redisCommandErrorsTotal = registerCounter(
  "redis_command_errors_total",
  "Redis command errors",
  ["client", "command"] as const,
);

/* ============================================================
 * Redis Server（INFO 采集）
 * ============================================================ */
export const redisServerInfo = registerGauge(
  "redis_server_info",
  "Redis server info fields",
  ["key"] as const,
);

export const redisServerKeysTotal = registerGauge(
  "redis_server_keys_total",
  "Total keys in current Redis DB",
);

export const redisServerHitRate = registerGauge(
  "redis_server_hit_rate",
  "Redis cache hit rate (0-1)",
);
