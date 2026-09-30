/**
 * Excel 表头（中文） → 业务字段（英文）映射工具
 */

export type HeaderMap = Record<string, string>;

/**
 * 将 Excel 行的中文表头转换为英文键
 * @param row        原始行数据（来自 xlsx sheet_to_json）
 * @param headerMap  中文 → 英文映射
 * @param options    trim / 忽略空值
 */
export function mapExcelRow<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  row: Record<string, unknown>,
  headerMap: HeaderMap,
  options: { trim?: boolean } = {},
): Partial<T> {
  const { trim = true } = options;
  const out: Record<string, unknown> = {};

  for (const [zhKey, enKey] of Object.entries(headerMap)) {
    const v = row[zhKey];
    if (v === undefined || v === null) continue;
    if (typeof v === "string") {
      out[enKey] = trim ? v.trim() : v;
    } else {
      out[enKey] = v;
    }
  }

  return out as Partial<T>;
}

/**
 * 收集缺失的必填字段（返回中文表头名）
 */
export function collectMissingFields(
  row: Record<string, unknown>,
  requiredEnKeys: string[],
  headerMap: HeaderMap,
): string[] {
  const missing: string[] = [];
  const enToZh = new Map(Object.entries(headerMap).map(([zh, en]) => [en, zh]));

  for (const en of requiredEnKeys) {
    const zh = enToZh.get(en);
    if (!zh) continue;
    const v = row[zh];
    if (v === undefined || v === null || (typeof v === "string" && !v.trim())) {
      missing.push(zh);
    }
  }
  return missing;
}

/** 日期时间字符串解析（容错） */
export function parseDateCell(v: unknown): Date | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === "number") {
    // xlsx 数字日期（1900 起）
    return new Date((v - 25569) * 86400000);
  }
  const s = String(v).trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
