import { client, register } from "./registry.js";

export const noticeSendTotal = new client.Counter({
  name: "notice_send_total",
  help: "通知发送总数",
  labelNames: ["tenant", "channel_type", "status"] as const,
  registers: [register],
});

export const noticeSendDuration = new client.Histogram({
  name: "notice_send_duration_seconds",
  help: "通知发送耗时",
  labelNames: ["channel_type"] as const,
  buckets: [0.1, 0.5, 1, 3, 5, 10],
  registers: [register],
});

export const noticeWsConnections = new client.Gauge({
  name: "notice_ws_connections",
  help: "WebSocket 连接数",
  labelNames: ["tenant"] as const,
  registers: [register],
});

export const noticeWsPushTotal = new client.Counter({
  name: "notice_ws_push_total",
  help: "WebSocket 推送总数",
  labelNames: ["status"] as const,
  registers: [register],
});
