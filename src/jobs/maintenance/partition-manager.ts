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

/** ✅ 表名白名单 */
function assertAllowedTable(table: string): void {
  if (!ALLOWED_TABLES.has(table)) {
    throw new Error(`partition-manager: table not allowed: ${table}`);
  }
}

/** ✅ 分区名格式：{table}_p{YYYY}{MM} */
const PART_NAME_RE = /^[a-z][a-z0-9_]*_p\d{6}$/;

function assertPartName(name: string): void {
  if (!PART_NAME_RE.test(name)) {
    throw new Error(`partition-manager: invalid partition name: ${name}`);
  }
}

/** ✅ 日期合法性校验：年份在合理区间，月份 1-12 */
function assertValidDate(d: Date): void {
  if (Number.isNaN(d.getTime())) {
    throw new Error(`partition-manager: invalid date: ${d}`);
  }
  const y = d.getUTCFullYear();
  if (y < 2000 || y > 2100) {
    throw new Error(`partition-manager: year out of range: ${y}`);
  }
}

function partName(table: string, d: Date): string {
  assertAllowedTable(table);
  assertValidDate(d);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const name = `${table}_p${y}${m}`;
  assertPartName(name);
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
  for (const { table } of TABLES) {
    assertAllowedTable(table);
    for (let i = 0; i <= 2; i++) {
      const from = addMonths(monthStart(now), i);
      const to = addMonths(from, 1);
      const name = partName(table, from);

      // ✅ 时间戳使用 toISOString，且经 assertValidDate 校验
      const fromIso = from.toISOString();
      const toIso = to.toISOString();

      await prisma.$executeRawUnsafe(
        `CREATE TABLE IF NOT EXISTS "${name}"
         PARTITION OF "${table}"
         FOR VALUES FROM ('${fromIso}') TO ('${toIso}')`,
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
      // ✅ 分区名正则校验
      if (!PART_NAME_RE.test(relname)) {
        logger.warn({ relname, table }, "[partitions] skip invalid part name");
        continue;
      }
      const m = /_p(\d{4})(\d{2})$/.exec(relname);
      if (!m) continue;

      const y = Number(m[1]);
      const mo = Number(m[2]);
      if (mo < 1 || mo > 12) {
        logger.warn({ relname, month: mo }, "[partitions] invalid month");
        continue;
      }

      const partDate = new Date(Date.UTC(y, mo - 1, 1));
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
