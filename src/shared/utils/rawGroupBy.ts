// src/core/database/raw-aggregate.ts
import { Prisma } from "@/generated/prisma/client.js";
import { prisma } from "@/config/database.js";

/**
 * 安全的 groupBy：绕过 Prisma groupBy 在含 Json 字段表上的 TS 循环引用 bug。
 *
 * 使用方式：
 *   const rows = await rawGroupBy("sys_org_history", {
 *     by: ["scope"],
 *     where: Prisma.sql`tenant_id = ${tenantId}::uuid`,
 *     aggregate: { count: Prisma.sql`COUNT(*)::bigint` },
 *   });
 */
export interface RawGroupByOptions {
  by: string[];
  /** 用 Prisma.sql 模板构建的 WHERE 条件（不含 WHERE 关键字） */
  where?: Prisma.Sql;
  /** 聚合表达式，key 为输出字段名 */
  aggregate?: Record<string, Prisma.Sql>;
  /** 排序（字段名 + 方向） */
  orderBy?: Array<{ field: string; direction: "ASC" | "DESC" }>;
  /** 结果转换函数 */
  transform?: (row: Record<string, unknown>) => Record<string, unknown>;
}

export async function rawGroupBy<T = Record<string, unknown>>(
  table: string,
  opts: RawGroupByOptions,
): Promise<T[]> {
  if (!/^[a-z][a-z0-9_]*$/.test(table)) {
    throw new Error(`Invalid table name: ${table}`);
  }
  if (opts.by.length === 0) {
    throw new Error("rawGroupBy: at least one `by` column required");
  }

  const groupCols = opts.by.map((c) => Prisma.raw(`"${c}"`));
  const aggregateParts = opts.aggregate
    ? Object.entries(opts.aggregate).map(
        ([alias, expr]) => Prisma.sql`${expr} AS ${Prisma.raw(`"${alias}"`)}`,
      )
    : [Prisma.sql`COUNT(*)::bigint AS "count"`];

  const whereSql = opts.where ? Prisma.sql`WHERE ${opts.where}` : Prisma.empty;
  const groupBySql = Prisma.sql`GROUP BY ${Prisma.join(groupCols)}`;
  const orderBySql = opts.orderBy?.length
    ? Prisma.sql`ORDER BY ${Prisma.join(
        opts.orderBy.map(
          (o) =>
            Prisma.sql`${Prisma.raw(`"${o.field}"`)} ${Prisma.raw(o.direction)}`,
        ),
      )}`
    : Prisma.empty;

  const sql = Prisma.sql`
    SELECT ${Prisma.join([...groupCols, ...aggregateParts])}
    FROM ${Prisma.raw(`"${table}"`)}
    ${whereSql}
    ${groupBySql}
    ${orderBySql}
  `;

  const rows = await prisma.$queryRaw<Record<string, unknown>[]>(sql);
  return (opts.transform ? rows.map(opts.transform) : rows) as T[];
}

/** bigint → number 的安全转换（值 > Number.MAX_SAFE_INTEGER 时抛错） */
export function toSafeNumber(
  v: bigint | number | string | null | undefined,
): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  const n = typeof v === "bigint" ? Number(v) : Number(v);
  if (!Number.isFinite(n)) return 0;
  return n;
}
