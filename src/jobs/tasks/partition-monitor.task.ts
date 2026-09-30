import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";
import {
  partitionSizeBytes,
  partitionRowCount,
} from "@/platform/metrics/partitions.js";

const LOG_TABLES = [
  "sys_audit_log",
  "sys_login_log",
  "sys_notice_send_log",
  "sys_job_log",
];

export async function runPartitionMonitorTask(): Promise<number> {
  const rows = await prisma.$queryRaw<
    Array<{ parent: string; partition: string; bytes: bigint; rows: bigint }>
  >`
    SELECT
      p.relname AS parent,
      c.relname AS partition,
      pg_total_relation_size(c.oid) AS bytes,
      c.reltuples::bigint AS rows
    FROM pg_class c
    JOIN pg_inherits i ON i.inhrelid = c.oid
    JOIN pg_class p ON p.oid = i.inhparent
    WHERE p.relname = ANY(${LOG_TABLES})
  `;

  for (const r of rows) {
    partitionSizeBytes.set(
      { table: r.parent, partition: r.partition },
      Number(r.bytes),
    );
    partitionRowCount.set(
      { table: r.parent, partition: r.partition },
      Number(r.rows),
    );
  }

  logger.info({ count: rows.length }, "[partition-monitor] done");
  return rows.length;
}
