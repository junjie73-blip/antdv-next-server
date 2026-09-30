import client from "prom-client";
import { register } from "./registry.js";

/** 慢查询计数 */
export const dbSlowQueryTotal = new client.Counter({
  name: "db_slow_query_total",
  help: "慢查询计数（>500ms）",
  labelNames: ["operation"],
  registers: [register],
});

/** 查询时长直方图 */
export const dbQueryDuration = new client.Histogram({
  name: "db_query_duration_seconds",
  help: "DB 查询时长分布",
  labelNames: ["operation"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5, 10],
  registers: [register],
});

/** 连接池使用 */
export const dbPoolConnections = new client.Gauge({
  name: "db_pool_connections",
  help: "Prisma 连接池使用数",
  labelNames: ["state"],
  registers: [register],
});

/** 从 SQL 提取操作类型 */
export function extractOperationType(query: string): string {
  const m = query.trim().match(/^(\w+)/i);
  return (m?.[1] ?? "other").toLowerCase();
}
