import { prisma } from "@/config/database.js";
import { logger } from "@/core/logger/index.js";
import { ValidationError } from "@/core/errors.js";
import type { DbColumn } from "../types.js";
import { toCamelCase } from "./naming.js";
import { mapTsType } from "./type-mapper.js";

interface DbTableRow {
  tableName: string;
  tableComment: string | null;
}

interface DbColumnRow {
  columnName: string;
  columnComment: string | null;
  dataType: string;
  udtName: string;
  maxLength: number | null;
  precision: number | null;
  scale: number | null;
  isNullable: string;
  columnDefault: string | null;
  sort: number;
}

interface PkColumnRow {
  column_name: string;
}

const IDENT_RE = /^[a-z][a-z0-9_]*$/;

function assertIdentifier(name: string): void {
  if (!IDENT_RE.test(name)) {
    throw new ValidationError(`非法标识符: ${name}`);
  }
}

/** 表是否已存在 */
export async function tableExists(tableName: string): Promise<boolean> {
  assertIdentifier(tableName);
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${tableName}
    ) AS exists
  `;
  return rows[0]?.exists ?? false;
}

/** 列出所有业务表（供"导入"使用） */
export async function listDbTables(): Promise<DbTableRow[]> {
  const rows = await prisma.$queryRaw<DbTableRow[]>`
    SELECT
      t.table_name AS "tableName",
      obj_description(('public.' || t.table_name)::regclass) AS "tableComment"
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND t.table_name NOT LIKE 'gen_%'
      AND t.table_name NOT LIKE '_prisma%'
    ORDER BY t.table_name
  `;
  logger.debug({ count: rows.length }, "[generator] list db tables");
  return rows;
}

/** 列出某张表的所有列 */
export async function listDbColumns(tableName: string): Promise<any[]> {
  assertIdentifier(tableName);

  const rows = await prisma.$queryRaw<DbColumnRow[]>`
    SELECT
      c.column_name              AS "columnName",
      col_description(('public.' || c.table_name)::regclass, c.ordinal_position) AS "columnComment",
      c.data_type                AS "dataType",
      c.udt_name                 AS "udtName",
      c.character_maximum_length AS "maxLength",
      c.numeric_precision        AS "precision",
      c.numeric_scale            AS "scale",
      c.is_nullable              AS "isNullable",
      c.column_default           AS "columnDefault",
      c.ordinal_position         AS "sort"
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = ${tableName}
    ORDER BY c.ordinal_position
  `;

  const pkRows = await prisma.$queryRaw<PkColumnRow[]>`
    SELECT kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema   = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema    = 'public'
      AND tc.table_name      = ${tableName}
  `;
  const pkSet = new Set(pkRows.map((r) => r.column_name));

  return rows.map((r) => ({
    columnName: r.columnName,
    columnComment: r.columnComment,
    columnType: formatFullType(r), // 返回完整类型
    tsType: mapTsType(r.udtName),
    fieldName: toCamelCase(r.columnName),
    isPk: pkSet.has(r.columnName) ? "1" : "0",
    isIncrement: String(r.columnDefault ?? "").includes("nextval(") ? "1" : "0",
    isRequired: r.isNullable === "NO" ? "1" : "0",
    defaultValue: r.columnDefault,
    sort: Number(r.sort),
  }));
}
function formatFullType(row: DbColumnRow): string {
  const udt = row.udtName;
  if (udt.startsWith("_")) return `${udt.slice(1)}[]`;
  if (row.maxLength !== null) return `${udt}(${row.maxLength})`;
  if (row.precision !== null && row.scale !== null) {
    return `${udt}(${row.precision},${row.scale})`;
  }
  if (row.precision !== null) return `${udt}(${row.precision})`;
  return udt;
}
