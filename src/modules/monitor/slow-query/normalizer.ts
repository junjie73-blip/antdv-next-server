// src/modules/monitor/slow-query/normalizer.ts
import { createHash } from "node:crypto";
import { FINGERPRINT_LEN } from "./constants.js";

/**
 * SQL 归一化：把具体参数替换为 `?`
 *
 * 例：
 *   SELECT * FROM t WHERE id = 'abc' AND age > 18 LIMIT 10
 *   → select * from t where id = ? and age > ? limit ?
 */
export function normalizeSql(sql: string): string {
  let s = sql;

  // 1. 单行注释
  s = s.replace(/--[^\n]*/g, " ");
  // 2. 多行注释
  s = s.replace(/\/\*[\s\S]*?\*\//g, " ");

  // 3. 字符串字面量：'...' / E'...' / $$...$$
  s = s.replace(/E?'(?:[^'\\]|\\.)*'/g, "?");
  s = s.replace(/\$\$[\s\S]*?\$\$/g, "?");

  // 4. 数字字面量（含小数）
  s = s.replace(/\b\d+(?:\.\d+)?\b/g, "?");

  // 5. 参数占位符 $1 $2 ...
  s = s.replace(/\$\d+/g, "?");

  // 6. IN (...) 里的多个 ? 合并为一个
  s = s.replace(/\bin\s*\(\s*\?(?:\s*,\s*\?)*\s*\)/gi, "in (?)");

  // 7. 压缩空白 + 小写
  s = s.replace(/\s+/g, " ").trim().toLowerCase();

  return s;
}

/**
 * fingerprint = sha256(tenantId:normalizedSql)
 * - 同一租户的相同 SQL 归一 → 同一指纹
 * - 不同租户隔离
 * - 系统 SQL（无租户）用 "system" 占位
 */
export function computeFingerprint(
  tenantId: string | null | undefined,
  normalizedSql: string,
): string {
  return createHash("sha256")
    .update(`${tenantId ?? "system"}:${normalizedSql}`)
    .digest("hex")
    .slice(0, FINGERPRINT_LEN);
}

/** 综合入口 */
export function fingerprintOf(
  sql: string,
  tenantId?: string | null,
): {
  normalized: string;
  fingerprint: string;
} {
  const normalized = normalizeSql(sql);
  return { normalized, fingerprint: computeFingerprint(tenantId, normalized) };
}

/**
 * 从归一化 SQL 中粗略提取过滤字段名，用于索引建议
 * - 只做 best-effort，不保证 100% 准确
 */
export function extractFilterColumns(normalizedSql: string): string[] {
  const cols = new Set<string>();

  // where xxx = ? / where xxx > ?
  const whereRe = /\bwhere\b([\s\S]*?)(?:\bgroup\b|\border\b|\blimit\b|$)/i;
  const whereMatch = normalizedSql.match(whereRe);
  if (whereMatch) {
    const body = whereMatch[1];
    const m = body.matchAll(
      /\b([a-z_][a-z0-9_]*)\s*(?:=|>|<|>=|<=|<>|!=|like|in|is)\b/gi,
    );
    for (const x of m) cols.add(x[1]);
  }

  // order by xxx
  const orderRe = /\border\s+by\s+([^)]+?)(?:\blimit\b|\bfor\b|$)/i;
  const orderMatch = normalizedSql.match(orderRe);
  if (orderMatch) {
    const parts = orderMatch[1].split(",");
    for (const p of parts) {
      const name = p.trim().split(/\s+/)[0];
      if (/^[a-z_][a-z0-9_]*$/i.test(name)) cols.add(name);
    }
  }

  return [...cols];
}
