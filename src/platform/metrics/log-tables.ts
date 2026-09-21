import { prisma } from "@/config/database.js";
import client from "prom-client";
import { register } from "./registry.js";

export const logTableSize = new client.Gauge({
  name: "log_table_size_bytes",
  help: "日志类表及分区总大小",
  labelNames: ["table"],
  registers: [register],
});

export async function collectLogTableSizes(): Promise<void> {
  const rows = await prisma.$queryRawUnsafe<
    { table_name: string; bytes: bigint }[]
  >(`
    SELECT p.relname AS table_name,
           pg_total_relation_size(c.oid) AS bytes
      FROM pg_class c
      JOIN pg_inherits i ON i.inhrelid = c.oid
      JOIN pg_class p ON p.oid = i.inhparent
     WHERE p.relname IN ('sys_audit_log','sys_login_log','sys_notice_send_log','sys_job_log')
  `);
  for (const r of rows) {
    logTableSize.set({ table: r.table_name }, Number(r.bytes));
  }
}
