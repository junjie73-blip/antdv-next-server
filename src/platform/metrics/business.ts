import client from "prom-client";
import { register } from "./registry.js";

export const noticeSentTotal = new client.Counter({
  name: "notice_sent_total",
  help: "Notifications sent",
  labelNames: ["channel", "status"],
  registers: [register],
});

export const uploadBytesTotal = new client.Counter({
  name: "upload_bytes_total",
  help: "Uploaded bytes",
  labelNames: ["tenant"],
  registers: [register],
});

export const queueSize = new client.Gauge({
  name: "audit_queue_size",
  help: "Audit queue length",
  registers: [register],
});

export const auditDroppedTotal = new client.Counter({
  name: "audit_dropped_total",
  help: "Audit items dropped",
  registers: [register],
});
