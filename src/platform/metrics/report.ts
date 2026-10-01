import { client, register } from "./registry.js";

/* ============================================================
 * 报表查询
 * ============================================================ */
export const rpQueryTotal = new client.Counter({
  name: "rp_query_total",
  help: "报表查询总数",
  labelNames: ["tenant", "report_code", "status"] as const,
  registers: [register],
});

export const rpQueryDuration = new client.Histogram({
  name: "rp_query_duration_seconds",
  help: "报表查询耗时",
  labelNames: ["report_code", "status"] as const,
  buckets: [0.1, 0.5, 1, 3, 5, 10, 30, 60],
  registers: [register],
});

export const rpQueryRows = new client.Histogram({
  name: "rp_query_rows",
  help: "报表返回行数",
  labelNames: ["report_code"] as const,
  buckets: [1, 10, 100, 1000, 10000, 100000],
  registers: [register],
});

/* ============================================================
 * SQL 执行
 * ============================================================ */
export const rpSqlTotal = new client.Counter({
  name: "rp_sql_total",
  help: "SQL 执行总数",
  labelNames: ["tenant", "status"] as const,
  registers: [register],
});

export const rpSqlDuration = new client.Histogram({
  name: "rp_sql_duration_seconds",
  help: "SQL 执行耗时",
  labelNames: ["status"] as const,
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 3, 5, 10, 30],
  registers: [register],
});

export const rpSqlTimeoutTotal = new client.Counter({
  name: "rp_sql_timeout_total",
  help: "SQL 超时总数",
  labelNames: ["tenant"] as const,
  registers: [register],
});

/* ============================================================
 * 缓存
 * ============================================================ */
export const rpCacheHitTotal = new client.Counter({
  name: "rp_cache_hit_total",
  help: "报表缓存命中总数",
  labelNames: ["tenant", "report_code"] as const,
  registers: [register],
});

export const rpCacheMissTotal = new client.Counter({
  name: "rp_cache_miss_total",
  help: "报表缓存未命中总数",
  labelNames: ["tenant", "report_code"] as const,
  registers: [register],
});

/* ============================================================
 * 导出
 * ============================================================ */
export const rpExportTotal = new client.Counter({
  name: "rp_export_total",
  help: "报表导出总数",
  labelNames: ["tenant", "report_code", "export_type", "status"] as const,
  registers: [register],
});

export const rpExportDuration = new client.Histogram({
  name: "rp_export_duration_seconds",
  help: "报表导出耗时",
  labelNames: ["export_type"] as const,
  buckets: [0.5, 1, 3, 5, 10, 30, 60, 300],
  registers: [register],
});

export const rpExportQueueSize = new client.Gauge({
  name: "rp_export_queue_size",
  help: "导出队列积压数",
  labelNames: ["tenant", "status"] as const,
  registers: [register],
});

/* ============================================================
 * 缓存预热
 * ============================================================ */
export const rpCacheWarmTotal = new client.Counter({
  name: "rp_cache_warm_total",
  help: "缓存预热总数",
  labelNames: ["tenant", "report_code", "status"] as const,
  registers: [register],
});

export const rpCacheWarmDuration = new client.Histogram({
  name: "rp_cache_warm_duration_seconds",
  help: "缓存预热耗时",
  labelNames: ["report_code"] as const,
  buckets: [0.1, 0.5, 1, 3, 5, 10, 30],
  registers: [register],
});
export const rpNotificationWsPushTotal = new client.Counter({
  name: "rp_notification_ws_push_total",
  help: "报表通知 WS 推送总数",
  labelNames: ["event_type", "status"] as const,
  registers: [register],
});

export const rpNotificationChannelTotal = new client.Counter({
  name: "rp_notification_channel_total",
  help: "报表通知渠道发送总数",
  labelNames: ["channel", "status"] as const,
  registers: [register],
});
export const rpExportRetryTotal = new client.Counter({
  name: "rp_export_retry_total",
  help: "导出任务重试总数",
  labelNames: ["export_type", "result"] as const, // result: scheduled|exhausted|success
  registers: [register],
});

export const rpExportRetryExhaustedTotal = new client.Counter({
  name: "rp_export_retry_exhausted_total",
  help: "导出任务重试耗尽总数",
  labelNames: ["tenant", "report_code", "export_type"] as const,
  registers: [register],
});
