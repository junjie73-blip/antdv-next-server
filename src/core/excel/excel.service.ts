import * as XLSX from "xlsx";
import { ZodTypeAny } from "zod";
import { AppError } from "@/core/errors.js";
import Cos from "cos-nodejs-sdk-v5";
import { env } from "@/config/env.js";
/** Excel 列定义 */
export interface ExcelColumn {
  /** 中文表头（导出用） */
  header: string;
  /** 数据字段名 */
  key: string;
  /** 列宽（字符数） */
  width?: number;
  /** 导出的转换函数 */
  formatter?: (value: any, row: any) => string | number;
}

/** 解析结果 */
export interface ParseResult<T> {
  rows: T[];
  errors: Array<{ rowNum: number; message: string }>;
}

/**
 * 解析 Excel Buffer，返回校验后的行数组
 * - 用 Zod schema 逐行校验
 * - 单行失败不阻断其他行，错误收集到 errors
 */
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
    const rowNum = idx + (options.skipHeader === false ? 1 : 2); // 默认跳过表头
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

/**
 * 生成 Excel Buffer
 */
export function generateExcel(
  rows: Record<string, any>[],
  columns: ExcelColumn[],
  sheetName = "Sheet1",
): Buffer {
  // 1) 按 columns 顺序构造表头 + 数据
  const headers = columns.map((c) => c.header);
  const dataRows = rows.map((row) => {
    return columns.map((col) => {
      const raw = row[col.key];
      if (col.formatter) return col.formatter(raw, row);
      if (raw === null || raw === undefined) return "";
      if (typeof raw === "object") return JSON.stringify(raw);
      return raw;
    });
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);

  // 2) 列宽
  ws["!cols"] = columns.map((c) => ({
    wch: c.width ?? Math.max(c.header.length * 2, 12),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

/**
 * 从导入的行里构造 parentName → parentId 映射（通用父子结构处理）
 * 用于菜单、部门等树形数据导入
 *
 * @param rows 待导入的所有行
 * @param getKey 从行里取唯一标识（如菜单名称）
 * @param getParentKey 从行里取父级标识（如上级菜单名称）
 * @param insert 插入函数，返回新记录的 ID
 * @param maxRounds 最大拓扑轮次，防止循环
 */
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

      // 无父级 or 父级已插入
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

    // 无进展 → 循环引用
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
