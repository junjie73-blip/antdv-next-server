import { client, register } from "./registry.js";

/* ============================================================
 * 工作流通知：业务埋点（与 wf-notify.worker 对应）
 * ============================================================ */

/** 通知发送总数（业务侧） */
export const wfNotificationTotal = new client.Counter({
  name: "wf_notification_total",
  help: "工作流通知总数",
  labelNames: ["tenant", "event_type", "channel_type", "status"] as const,
  registers: [register],
});

/** 通知发送耗时 */
export const wfNotificationDuration = new client.Histogram({
  name: "wf_notification_duration_seconds",
  help: "工作流通知发送耗时",
  labelNames: ["channel_type", "phase"] as const,
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 3, 5, 10],
  registers: [register],
});

/** ⭐ WS 推送计数 */
export const wfNotificationWsPushTotal = new client.Counter({
  name: "wf_notification_ws_push_total",
  help: "工作流通知 WS 推送总数",
  labelNames: ["event_type", "status"] as const,
  registers: [register],
});

/** ⭐ WS 推送耗时 */
export const wfNotificationWsPushDuration = new client.Histogram({
  name: "wf_notification_ws_push_duration_seconds",
  help: "工作流通知 WS 推送耗时",
  labelNames: ["phase"] as const,
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
  registers: [register],
});

/** ⭐ WS 推送待发送计数（Gauge） */
export const wfNotificationPending = new client.Gauge({
  name: "wf_notification_pending",
  help: "工作流通知待发送数",
  labelNames: ["tenant"] as const,
  registers: [register],
});
