import * as XLSX from "xlsx";
import { logger } from "@/platform/logger/index.js";
import type { ExportResult } from "./handlers/types.js";
import { ExcelColumn } from "@/platform/excel/index.js";

/* ============================================================
 * 限制
 * ============================================================ */
const MAX_XLSX_ROWS = 100_000; // xlsx 单 sheet 建议上限（内存约束）
const XLSX_WARN_ROWS = 50_000; // 超过则 warn

export interface WriteOptions {
  format: "xlsx" | "csv" | "json";
  columns?: ExcelColumn[];
  /** sheet 名（xlsx 用） */
  sheetName?: string;
  /** 进度回调：written 已写行数，total 总行数（可能为空） */
  onProgress?: (written: number, total?: number) => void;
}

export interface WriteResult {
  buffer: Buffer;
  rowCount: number;
  /** ⭐ 因为行数超限从 xlsx 降级为 csv 时置为 true */
  downgraded?: boolean;
  /** 实际写入的格式（可能因为降级与入参不同） */
  actualFormat: "xlsx" | "csv" | "json";
}

/* ============================================================
 * 主入口
 * ============================================================ */
export async function writeExport(
  result: ExportResult,
  opts: WriteOptions,
): Promise<WriteResult> {
  switch (opts.format) {
    case "csv":
      return writeCsv(result, opts);
    case "json":
      return writeJson(result, opts);
    case "xlsx":
    default:
      return writeXlsx(result, opts);
  }
}

/* ============================================================
 * CSV：真正的流式，无行数上限
 * ============================================================ */
async function writeCsv(
  result: ExportResult,
  opts: WriteOptions,
): Promise<WriteResult> {
  const columns = await resolveColumns(result, opts);

  const chunks: string[] = [];
  chunks.push(columns.map((c) => escapeCsv(c.header)).join(","));

  let rowCount = 0;
  for await (const row of result.rows) {
    chunks.push(
      columns
        .map((c) => escapeCsv(formatCell(applyFormatter(c, row[c.key], row))))
        .join(","),
    );
    rowCount++;
    if (rowCount % 5000 === 0) opts.onProgress?.(rowCount, result.totalCount);
  }
  opts.onProgress?.(rowCount, result.totalCount);

  // BOM 让 Excel 打开中文正常
  const body = "\uFEFF" + chunks.join("\n");
  return {
    buffer: Buffer.from(body, "utf-8"),
    rowCount,
    actualFormat: "csv",
  };
}

/* ============================================================
 * JSON：内存模式
 * ============================================================ */
async function writeJson(
  result: ExportResult,
  opts: WriteOptions,
): Promise<WriteResult> {
  const rows: unknown[] = [];
  let rowCount = 0;
  for await (const row of result.rows) {
    rows.push(row);
    rowCount++;
    if (rowCount % 5000 === 0) opts.onProgress?.(rowCount, result.totalCount);
  }
  opts.onProgress?.(rowCount, result.totalCount);

  return {
    buffer: Buffer.from(JSON.stringify(rows, null, 2), "utf-8"),
    rowCount,
    actualFormat: "json",
  };
}

/* ============================================================
 * XLSX：SheetJS 内存模式
 * ============================================================ */
async function writeXlsx(
  result: ExportResult,
  opts: WriteOptions,
): Promise<WriteResult> {
  // 预检查：handler 提供了 totalCount 且超限 → 直接降级
  if (result.totalCount && result.totalCount > MAX_XLSX_ROWS) {
    logger.warn(
      { totalCount: result.totalCount, max: MAX_XLSX_ROWS },
      "[export] xlsx 行数超限，自动降级为 CSV",
    );
    const r = await writeCsv(result, opts);
    return { ...r, downgraded: true };
  }

  let columns: ExcelColumn[] | undefined = opts.columns ?? result.columns;

  // aoa（array of arrays）模式，比 json_to_sheet 更快
  const aoa: unknown[][] = [];
  let rowCount = 0;

  for await (const row of result.rows) {
    if (rowCount >= MAX_XLSX_ROWS) {
      throw new Error(
        `xlsx 单表最多 ${MAX_XLSX_ROWS} 行，请改用 CSV 或按时间拆分导出`,
      );
    }

    // 首次迭代时若还没有 columns，则从第一行推断
    if (!columns) {
      columns = Object.keys(row).map((k) => ({ header: k, key: k }));
      aoa.push(columns.map((c) => c.header));
    }

    aoa.push(
      columns.map((c) =>
        normalizeCellValue(applyFormatter(c, row[c.key], row)),
      ),
    );
    rowCount++;
    if (rowCount % 5000 === 0) opts.onProgress?.(rowCount, result.totalCount);
    if (rowCount === XLSX_WARN_ROWS) {
      logger.warn({ rowCount }, "[export] xlsx 行数较多，内存占用可能较高");
    }
  }

  // 空数据：至少写一个表头占位
  if (aoa.length === 0) {
    aoa.push((columns ?? []).map((c) => c.header));
  }

  opts.onProgress?.(rowCount, result.totalCount);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // 列宽
  if (columns) {
    ws["!cols"] = columns.map((c) => ({ wch: c.width ?? 20 }));
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, opts.sheetName ?? "Data");

  const buffer = XLSX.write(wb, {
    type: "buffer",
    bookType: "xlsx",
    compression: true,
  }) as Buffer;

  return {
    buffer,
    rowCount,
    actualFormat: "xlsx",
  };
}

/* ============================================================
 * Helpers
 * ============================================================ */

/**
 * 获取列定义：
 * 1. 优先 opts.columns
 * 2. 其次 result.columns（handler 提供）
 * 3. 都没有 → 返回空数组，交给 writeXlsx 从第一行推断
 */
async function resolveColumns(
  result: ExportResult,
  opts: WriteOptions,
): Promise<ExcelColumn[]> {
  if (opts.columns && opts.columns.length > 0) return opts.columns;
  if (result.columns && result.columns.length > 0) return result.columns;
  return [];
}

function applyFormatter(
  col: ExcelColumn,
  v: unknown,
  row: Record<string, any>,
): unknown {
  return col.formatter ? col.formatter(v, row) : v;
}

/** xlsx 单元格只接受 string/number/boolean/Date；其他转字符串 */
function normalizeCellValue(
  v: unknown,
): string | number | boolean | Date | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v;
  const t = typeof v;
  if (t === "string" || t === "number" || t === "boolean") return v as any;
  // BigInt / Object / Array → 字符串
  if (t === "bigint") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString();
  const t = typeof v;
  if (t === "string" || t === "number" || t === "boolean") return String(v);
  if (t === "bigint") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function escapeCsv(v: string): string {
  if (
    v.includes(",") ||
    v.includes('"') ||
    v.includes("\n") ||
    v.includes("\r")
  ) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}
