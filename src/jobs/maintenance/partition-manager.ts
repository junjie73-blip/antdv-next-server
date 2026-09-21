import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";
import { env } from "@/config/env.js";
import { archiveAndDrop } from "./archive.js";

interface PartitionedTable {
  table: string;
  retentionMonths: number;
}

/** ⭐ 白名单：所有表名必须在此列，防 SQL 注入 */
const TABLES: PartitionedTable[] = [
  { table: "sys_audit_log", retentionMonths: 6 },
  { table: "sys_login_log", retentionMonths: 3 },
  { table: "sys_notice_send_log", retentionMonths: 3 },
  { table: "sys_job_log", retentionMonths: 3 },
];

const ALLOWED_TABLES = new Set(TABLES.map((t) => t.table));

function assertAllowedTable(table: string): void {
  if (!ALLOWED_TABLES.has(table)) {
    throw new Error(`partition-manager: table not allowed: ${table}`);
  }
}

function partName(table: string, d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${table}_p${y}${m}`;
}

function monthStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function addMonths(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

/** 预建未来 3 个月分区 */
export async function maintainPartitions(): Promise<void> {
  const now = new Date();
  for (const { table } of TABLES) {
    assertAllowedTable(table);
    for (let i = 0; i <= 2; i++) {
      const from = addMonths(monthStart(now), i);
      const to = addMonths(from, 1);
      const name = partName(table, from);
      await prisma.$executeRawUnsafe(
        `CREATE TABLE IF NOT EXISTS "${name}"
         PARTITION OF "${table}"
         FOR VALUES FROM ('${from.toISOString()}') TO ('${to.toISOString()}')`,
      );
    }
  }
  logger.info("[partitions] ensured");
}

/** 扫描所有分区，超过保留期的归档后删除 */
export async function archiveExpiredPartitions(): Promise<void> {
  const now = new Date();
  const storageEnabled = env.MINIO_ENABLED;

  for (const { table, retentionMonths } of TABLES) {
    assertAllowedTable(table);
    const cutoff = addMonths(monthStart(now), -retentionMonths);

    const rows = await prisma.$queryRawUnsafe<{ relname: string }[]>(
      `SELECT c.relname
         FROM pg_class c
         JOIN pg_inherits i ON i.inhrelid = c.oid
         JOIN pg_class p ON p.oid = i.inhparent
        WHERE p.relname = $1`,
      table,
    );

    for (const { relname } of rows) {
      const m = /_p(\d{4})(\d{2})$/.exec(relname);
      if (!m) continue;
      const partDate = new Date(Date.UTC(+m[1], +m[2] - 1, 1));
      if (partDate >= cutoff) continue;

      if (storageEnabled) {
        await archiveAndDrop(table, relname);
      } else {
        logger.warn(
          { relname },
          "[partitions] storage disabled, dropping without archive",
        );
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${relname}"`);
      }
    }
  }
  logger.info("[partitions] expired archived");
}
