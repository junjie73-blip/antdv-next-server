import { client, register } from "./registry.js";

/* ============================================================
 * 流程实例
 * ============================================================ */
export const wfInstanceTotal = new client.Counter({
  name: "wf_instance_total",
  help: "工作流实例总数",
  labelNames: ["tenant", "def_key", "status"] as const,
  registers: [register],
});

export const wfInstanceDuration = new client.Histogram({
  name: "wf_instance_duration_seconds",
  help: "流程实例耗时",
  labelNames: ["tenant", "def_key"] as const,
  buckets: [60, 300, 1800, 3600, 86400, 604800],
  registers: [register],
});

/* ============================================================
 * 任务
 * ============================================================ */
export const wfTaskTotal = new client.Counter({
  name: "wf_task_total",
  help: "工作流任务总数",
  labelNames: ["tenant", "def_key", "node_id", "action"] as const,
  registers: [register],
});

export const wfTaskDuration = new client.Histogram({
  name: "wf_task_duration_seconds",
  help: "任务完成耗时",
  labelNames: ["def_key", "node_id"] as const,
  buckets: [1, 60, 300, 1800, 3600, 86400],
  registers: [register],
});

export const wfTaskPending = new client.Gauge({
  name: "wf_task_pending",
  help: "当前待处理任务数",
  labelNames: ["tenant"] as const,
  registers: [register],
});

export const wfTaskTimeoutTotal = new client.Counter({
  name: "wf_task_timeout_total",
  help: "超时任务总数",
  labelNames: ["tenant", "def_key", "node_id", "action"] as const,
  registers: [register],
});

/* ============================================================
 * 引擎
 * ============================================================ */
export const wfEngineDuration = new client.Histogram({
  name: "wf_engine_duration_seconds",
  help: "引擎操作耗时",
  labelNames: ["operation"] as const,
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 3, 5],
  registers: [register],
});

export const wfEngineErrors = new client.Counter({
  name: "wf_engine_errors_total",
  help: "引擎错误总数",
  labelNames: ["operation", "error_type"] as const,
  registers: [register],
});
