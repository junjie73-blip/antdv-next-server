import type { DbColumn, TableDdl } from "../types.js";
import { toCamelCase } from "./naming.js";
import {
  mapTsType,
  guessHtmlType,
  isAuditField,
  isQueryCandidate,
} from "./type-mapper.js";

interface ColumnInput {
  columnName: string;
  columnType: string;
  length?: number | null;
  precision?: number | null;
  scale?: number | null;
  isPk: string;
  isIncrement: string;
  isRequired: string;
  defaultValue?: string | null;
  columnComment?: string | null;
}

function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

function formatPgType(col: ColumnInput): string {
  let type = col.columnType;
  if (col.length) type += `(${col.length})`;
  else if (col.precision && col.scale !== undefined && col.scale !== null) {
    type += `(${col.precision},${col.scale})`;
  } else if (col.precision) {
    type += `(${col.precision})`;
  }
  return type;
}

function buildColumnDdl(col: ColumnInput): string {
  // 自增：serial / bigserial
  if (col.isIncrement === "1") {
    const base = col.columnType
      .replace(/\(.*\)/, "")
      .trim()
      .toLowerCase();
    if (base === "int4" || base === "int")
      return `  "${col.columnName}" serial`;
    if (base === "int8" || base === "bigint")
      return `  "${col.columnName}" bigserial`;
  }

  let sql = `  "${col.columnName}" ${col.columnType}`;
  if (col.defaultValue) sql += ` DEFAULT ${col.defaultValue}`;
  if (col.isRequired === "1") sql += " NOT NULL";
  return sql;
}

/**
 * 从列配置生成建表 DDL
 * 说明：
 *  - CREATE TABLE + 主键 + 索引 + 注释
 *  - 不含外键 / 触发器（规范禁止数据库外键）
 */
export function buildCreateTableDdl(
  tableName: string,
  tableComment: string | null,
  columns: ColumnInput[],
): TableDdl {
  const lines = columns.map(buildColumnDdl);
  const pks = columns
    .filter((c) => c.isPk === "1")
    .map((c) => `"${c.columnName}"`);
  if (pks.length > 0) lines.push(`  PRIMARY KEY (${pks.join(", ")})`);

  const createTableSql = `CREATE TABLE IF NOT EXISTS "${tableName}" (\n${lines.join(",\n")}\n);`;

  const indexSqls: string[] = [];
  if (columns.some((c) => c.columnName === "tenant_id")) {
    indexSqls.push(
      `CREATE INDEX IF NOT EXISTS "idx_${tableName}_tenant" ON "${tableName}" (tenant_id);`,
    );
  }
  if (columns.some((c) => c.columnName === "is_deleted")) {
    indexSqls.push(
      `CREATE INDEX IF NOT EXISTS "idx_${tableName}_deleted" ON "${tableName}" (is_deleted);`,
    );
  }

  const commentSqls: string[] = [];
  if (tableComment) {
    commentSqls.push(
      `COMMENT ON TABLE "${tableName}" IS '${escapeSql(tableComment)}';`,
    );
  }
  for (const c of columns) {
    if (!c.columnComment) continue;
    commentSqls.push(
      `COMMENT ON COLUMN "${tableName}"."${c.columnName}" IS '${escapeSql(c.columnComment)}';`,
    );
  }

  return { createTableSql, indexSqls, commentSqls };
}

/** 把 DB 元数据补全为完整列配置 */
export function enrichColumnFromDb(db: DbColumn): ColumnInput & {
  tsType: string;
  fieldName: string;
  htmlType: string;
  isInsert: string;
  isEdit: string;
  isList: string;
  isQuery: string;
  queryType: string;
} {
  const tsType = mapTsType(db.udtName);
  const isAudit = isAuditField(db.columnName);

  return {
    columnName: db.columnName,
    columnType: db.udtName,
    length: db.maxLength,
    precision: db.precision,
    scale: db.scale,
    isPk: db.isPk ? "1" : "0",
    isIncrement: db.isIncrement ? "1" : "0",
    isRequired: db.isNullable ? "0" : "1",
    defaultValue: db.columnDefault,
    columnComment: db.columnComment,
    tsType,
    fieldName: toCamelCase(db.columnName),
    htmlType: guessHtmlType(db.columnName, tsType),
    isInsert: isAudit || db.isPk ? "0" : "1",
    isEdit: isAudit || db.isPk ? "0" : "1",
    isList: isAudit ? "0" : "1",
    isQuery: isQueryCandidate(db.columnName) ? "1" : "0",
    queryType: db.columnName.endsWith("_name") ? "LIKE" : "EQ",
  };
}
