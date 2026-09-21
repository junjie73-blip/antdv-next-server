import * as XLSX from "xlsx";
import { ZodTypeAny } from "zod";
import { AppError } from "@/core/errors.js";

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  formatter?: (value: any, row: any) => string | number;
}

export interface ParseResult<T> {
  rows: T[];
  errors: Array<{ rowNum: number; message: string }>;
}

export function parseExcel<T>(
  buffer: Buffer,
  rowSchema: ZodTypeAny,
  options: { skipHeader?: boolean } = {},
): ParseResult<T> {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer" });
  } catch {
    throw new AppError("Excel 文件格式错误", 400001, 400);
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new AppError("Excel 中没有工作表", 400001, 400);

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<
    string,
    any
  >[];

  const result: ParseResult<T> = { rows: [], errors: [] };

  rows.forEach((raw, idx) => {
    const rowNum = idx + (options.skipHeader === false ? 1 : 2);
    const parsed = rowSchema.safeParse(raw);
    if (parsed.success) {
      result.rows.push(parsed.data as T);
    } else {
      const message = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      result.errors.push({ rowNum, message });
    }
  });

  return result;
}

export function generateExcel(
  rows: Record<string, any>[],
  columns: ExcelColumn[],
  sheetName = "Sheet1",
): Buffer {
  const headers = columns.map((c) => c.header);
  const dataRows = rows.map((row) =>
    columns.map((col) => {
      const raw = row[col.key];
      if (col.formatter) return col.formatter(raw, row);
      if (raw === null || raw === undefined) return "";
      if (typeof raw === "object") return JSON.stringify(raw);
      return raw;
    }),
  );

  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  ws["!cols"] = columns.map((c) => ({
    wch: c.width ?? Math.max(c.header.length * 2, 12),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export async function importTreeData<T>(
  rows: T[],
  getKey: (row: T) => string,
  getParentKey: (row: T) => string,
  insert: (row: T, parentId: string | null) => Promise<string>,
  maxRounds = 10,
): Promise<{
  successCount: number;
  errors: Array<{ row: T; message: string }>;
  keyToId: Map<string, string>;
}> {
  const keyToId = new Map<string, string>();
  const errors: Array<{ row: T; message: string }> = [];
  let pending = [...rows];
  let successCount = 0;

  for (let round = 0; round < maxRounds && pending.length > 0; round++) {
    const next: T[] = [];

    for (const row of pending) {
      const key = getKey(row);
      const parentKey = getParentKey(row);

      if (!parentKey || keyToId.has(parentKey)) {
        try {
          const parentId = parentKey ? keyToId.get(parentKey)! : null;
          const newId = await insert(row, parentId);
          keyToId.set(key, newId);
          successCount++;
        } catch (e: any) {
          errors.push({ row, message: e?.message || "插入失败" });
        }
      } else {
        next.push(row);
      }
    }

    if (next.length === pending.length) {
      for (const r of next) {
        errors.push({
          row: r,
          message: `找不到上级「${getParentKey(r)}」或存在循环引用`,
        });
      }
      break;
    }
    pending = next;
  }

  return { successCount, errors, keyToId };
}
