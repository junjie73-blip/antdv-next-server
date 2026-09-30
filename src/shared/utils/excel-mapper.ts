/**
 * 将 Excel 行的中文表头映射到英文键
 * 用法：
 *   const raw = { 部门编码: "D01", 部门名称: "研发部" };
 *   const mapped = mapExcelRow(raw, DEPT_HEADER_MAP);
 *   // → { deptCode: "D01", deptName: "研发部" }
 */
export function mapExcelRow<T extends Record<string, unknown>>(
  row: Record<string, unknown>,
  headerMap: Record<string, string>,
): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [zhKey, enKey] of Object.entries(headerMap)) {
    const v = row[zhKey];
    if (v !== undefined) {
      out[enKey] = typeof v === "string" ? v.trim() : v;
    }
  }
  return out as Partial<T>;
}

/** 生成缺失字段的错误提示 */
export function collectMissingFields(
  row: Record<string, unknown>,
  required: string[],
  headerMap: Record<string, string>,
): string[] {
  const missing: string[] = [];
  for (const enKey of required) {
    const zhKey = Object.entries(headerMap).find(([, v]) => v === enKey)?.[0];
    if (zhKey && !row[zhKey]) missing.push(zhKey);
  }
  return missing;
}
