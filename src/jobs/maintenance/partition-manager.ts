// jobs/maintenance/partition-manager.ts
import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";

interface PartitionedTable {
  table: string;
  /** 预建未来 N 个月 */
  aheadMonths?: number;
}

/** ⭐ 只保留"预建分区"职责 */
const PARTITIONED_TABLES: PartitionedTable[] = [
  { table: "sys_audit_log" },
  { table: "sys_login_log" },
  { table: "sys_notice_send_log" },
  { table: "sys_job_log" },
];

const PARTITION_NAME_RE = /^[a-z][a-z0-9_]*_p\d{6}$/;

function partName(table: string, d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const name = `${table}_p${y}${m}`;
  if (!PARTITION_NAME_RE.test(name))
    throw new Error(`invalid partition name: ${name}`);
  return name;
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
  for (const { table } of PARTITIONED_TABLES) {
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
