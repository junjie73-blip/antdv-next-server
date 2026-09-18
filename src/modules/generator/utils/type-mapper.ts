/** PG udt_name -> TS 类型 */
const PG_TO_TS: Record<string, string> = {
  int2: "number",
  int4: "number",
  int8: "bigint",
  float4: "number",
  float8: "number",
  numeric: "number",
  decimal: "number",
  money: "number",
  bool: "boolean",
  varchar: "string",
  bpchar: "string",
  text: "string",
  uuid: "string",
  json: "unknown",
  jsonb: "unknown",
  timestamp: "Date",
  timestamptz: "Date",
  date: "Date",
  time: "string",
  bytea: "Buffer",
};

export function mapTsType(udtName: string): string {
  return PG_TO_TS[udtName] ?? "unknown";
}

/** TS 类型 -> Zod 表达式 */
export function zodFromTsType(tsType: string, required: boolean): string {
  const base = (() => {
    switch (tsType) {
      case "string":
        return "z.string()";
      case "number":
        return "z.number()";
      case "bigint":
        return "z.number().int()";
      case "boolean":
        return "z.boolean()";
      case "Date":
        return "z.coerce.date()";
      default:
        return "z.unknown()";
    }
  })();
  return required ? base : `${base}.optional()`;
}

/** 根据列名 + TS 类型推断表单控件 */
export function guessHtmlType(columnName: string, tsType: string): string {
  const name = columnName.toLowerCase();
  if (
    name.endsWith("status") ||
    name.endsWith("state") ||
    name.endsWith("enabled")
  )
    return "radio";
  if (
    name.endsWith("type") ||
    name.endsWith("gender") ||
    name.endsWith("category")
  )
    return "select";
  if (
    name.includes("avatar") ||
    name.includes("image") ||
    name.includes("photo")
  )
    return "imageUpload";
  if (name.includes("file") || name.includes("attachment")) return "fileUpload";
  if (
    name.includes("remark") ||
    name.includes("desc") ||
    name.includes("content")
  )
    return "textarea";
  if (tsType === "Date") return "datetime";
  if (tsType === "number" || tsType === "bigint") return "inputNumber";
  if (tsType === "boolean") return "switch";
  return "input";
}

/** 审计字段（不参与表单/列表） */
export const AUDIT_FIELDS = [
  "tenant_id",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "is_deleted",
] as const;

export function isAuditField(name: string): boolean {
  return (AUDIT_FIELDS as readonly string[]).includes(name);
}

/** 查询候选：以 _name / _code / _title 等结尾 */
export function isQueryCandidate(name: string): boolean {
  return /(_name|_code|_title|_status|_type|_key|_no)$/.test(name);
}
