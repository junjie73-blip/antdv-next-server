import client from "prom-client";
import { register } from "./registry.js";

export const partitionSizeBytes = new client.Gauge({
  name: "partition_size_bytes",
  help: "分区大小",
  labelNames: ["table", "partition"],
  registers: [register],
});

export const partitionRowCount = new client.Gauge({
  name: "partition_row_count",
  help: "分区行数（估算）",
  labelNames: ["table", "partition"],
  registers: [register],
});
