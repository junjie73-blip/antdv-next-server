import { Counter, Gauge } from "prom-client";
import { register } from "./registry.js";

export const backupTotal = new Counter({
  name: "backup_total",
  help: "Backup tasks by status",
  labelNames: ["status", "trigger_type"],
  registers: [register],
});

export const backupLastSuccessTimestamp = new Gauge({
  name: "backup_last_success_timestamp",
  help: "Unix timestamp of last successful backup",
  registers: [register],
});
