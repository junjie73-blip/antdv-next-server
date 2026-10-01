import * as XLSX from "xlsx";
import type { ReportColumn, ReportConfig } from "../types.js";

export interface ExcelExportOptions {
  title?: string;
  sheetName?: string;
  columns: ReportColumn[];
  rows: Record<string, any>[];
  summary?: Record<string, any>;
  config?: ReportConfig;
  meta?: {
    userName?: string;
    tenantName?: string;
    generatedAt?: Date;
  };
}

/** 中文字符宽度（1 个汉字 ≈ 2 个英文字符） */
function chineseWidth(text: string): number {
  let width = 0;
  for (const ch of String(text)) {
    width += ch.charCodeAt(0) > 255 ? 2 : 1;
  }
  return width;
}

export class ExcelExporter {
  /**
   * 导出 Excel（返回 Buffer）
   */
  static async export(options: ExcelExportOptions): Promise<Buffer> {
    const wb = XLSX.utils.book_new();
    const sheetName = this.safeSheetName(
      options.sheetName ?? options.title ?? "Sheet1",
    );

    const columns = options.columns;

    /* ============================================================
     * 1. 构造 AOA（Array of Arrays）
     * ============================================================ */
    const aoa: any[][] = [];
    const merges: XLSX.Range[] = [];

    // ---- 1.1 标题行 ----
    if (options.title) {
      const rowIdx = aoa.length;
      // 用 columns.length 个空串填充，便于后续合并
      aoa.push([options.title, ...Array(columns.length - 1).fill("")]);
      merges.push({
        s: { r: rowIdx, c: 0 },
        e: { r: rowIdx, c: columns.length - 1 },
      });
    }

    // ---- 1.2 元信息行 ----
    if (options.meta) {
      const rowIdx = aoa.length;
      const metaText = [
        options.meta.tenantName && `租户：${options.meta.tenantName}`,
        options.meta.userName && `导出人：${options.meta.userName}`,
        `导出时间：${(options.meta.generatedAt ?? new Date()).toLocaleString("zh-CN")}`,
      ]
        .filter(Boolean)
        .join("  |  ");

      aoa.push([metaText, ...Array(columns.length - 1).fill("")]);
      merges.push({
        s: { r: rowIdx, c: 0 },
        e: { r: rowIdx, c: columns.length - 1 },
      });
    }

    // ---- 1.3 表头行 ----
    const headerRowIdx = aoa.length;
    aoa.push(columns.map((c) => c.label));

    // ---- 1.4 数据行 ----
    const dataStartRow = aoa.length;
    for (const row of options.rows) {
      aoa.push(columns.map((c) => this.formatCell(row[c.key], c.type)));
    }
    const dataEndRow = aoa.length - 1;

    // ---- 1.5 汇总行 ----
    if (options.summary) {
      const summaryRow = columns.map((c, i) => {
        if (i === 0) return "合计";
        const val = options.summary![c.key];
        return val !== undefined ? this.formatCell(val, c.type) : "";
      });
      aoa.push(summaryRow);
    }

    /* ============================================================
     * 2. 转换为工作表
     * ============================================================ */
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // ---- 2.1 合并单元格 ----
    if (merges.length > 0) {
      ws["!merges"] = merges;
    }

    /* ============================================================
     * 3. 列宽设置
     * ============================================================ */
    ws["!cols"] = columns.map((col) => {
      if (col.width) return { wch: col.width };

      // 表头宽度
      const headerWidth = chineseWidth(col.label) + 2;
      let maxWidth = headerWidth;

      // 前 100 行数据宽度
      const sample = options.rows.slice(0, 100);
      for (const row of sample) {
        const val = this.formatCell(row[col.key], col.type);
        const w = chineseWidth(String(val ?? "")) + 2;
        if (w > maxWidth) maxWidth = w;
      }

      return { wch: Math.max(8, Math.min(50, maxWidth)) };
    });

    /* ============================================================
     * 4. 数值格式（千分位 / 小数位）
     * ============================================================ */
    if (dataEndRow >= dataStartRow) {
      for (let r = dataStartRow; r <= dataEndRow; r++) {
        for (let c = 0; c < columns.length; c++) {
          const col = columns[c];
          if (col.type !== "number") continue;

          const addr = XLSX.utils.encode_cell({ r, c });
          const cell = ws[addr];
          if (!cell || typeof cell.v !== "number") continue;

          // 设置数字格式（显示用）
          if (Number.isInteger(cell.v)) {
            cell.z = "#,##0";
          } else {
            cell.z = "#,##0.00";
          }
        }
      }

      // 汇总行同样处理
      if (options.summary) {
        const summaryRowIdx = dataEndRow + 1;
        for (let c = 0; c < columns.length; c++) {
          const col = columns[c];
          if (col.type !== "number") continue;

          const addr = XLSX.utils.encode_cell({ r: summaryRowIdx, c });
          const cell = ws[addr];
          if (!cell || typeof cell.v !== "number") continue;

          if (Number.isInteger(cell.v)) {
            cell.z = "#,##0";
          } else {
            cell.z = "#,##0.00";
          }
        }
      }
    }

    /* ============================================================
     * 5. 行高（表头稍高，可读性更好）
     * ============================================================ */
    const rowCount = aoa.length;
    const rows: XLSX.RowInfo[] = [];
    for (let i = 0; i < rowCount; i++) {
      if (options.title && i === 0) {
        rows.push({ hpt: 24 }); // 标题行
      } else if (i === headerRowIdx) {
        rows.push({ hpt: 20 }); // 表头
      } else {
        rows.push({ hpt: 16 }); // 数据行
      }
    }
    ws["!rows"] = rows;

    /* ============================================================
     * 6. 冻结窗格（ySplit 到表头下方）
     * ============================================================
     * 注意：SheetJS 社区版对 !freeze 支持有限，部分版本需要
     * 手动写 XML 才能生效。此处写入兼容字段，实际效果取决于版本。
     */
    // ws['!freeze'] = {
    //   xSplit: 0,
    //   ySplit: headerRowIdx + 1,
    //   topLeftCell: XLSX.utils.encode_cell({ r: headerRowIdx + 1, c: 0 }),
    //   activePane: 'bottomLeft',
    //   state: 'frozen',
    // };

    /* ============================================================
     * 7. 追加到工作簿 + 输出 Buffer
     * ============================================================ */
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const buffer = XLSX.write(wb, {
      type: "buffer",
      bookType: "xlsx",
      compression: true,
    }) as Buffer;

    return buffer;
  }

  /**
   * 流式导出（大数据量场景）
   * 使用 XLSX.stream 需要结合 write 的 stream 模式
   * 这里保留接口，大文件时切到异步导出（阶段 4）
   */
  static async exportToStream(
    options: ExcelExportOptions,
    stream: NodeJS.WritableStream,
  ): Promise<void> {
    const buffer = await this.export(options);
    stream.write(buffer);
    stream.end();
  }

  /* ============================================================
   * 内部工具方法
   * ============================================================ */

  /**
   * 格式化单元格值
   */
  private static formatCell(value: any, type?: string): any {
    if (value === null || value === undefined) return "";

    if (type === "number") {
      const n = Number(value);
      return isNaN(n) ? value : n;
    }

    if (type === "date") {
      const d = new Date(value);
      if (isNaN(d.getTime())) return String(value);
      // 转成字符串，避免时区问题
      return d.toLocaleString("zh-CN");
    }

    if (type === "boolean") {
      return value ? "是" : "否";
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return value;
  }

  /**
   * 安全 sheet 名
   * Excel 限制：最多 31 字符，不能含 : \ / ? * [ ]
   */
  private static safeSheetName(name: string): string {
    return name.replace(/[:\\/?*[\]]/g, "_").slice(0, 31) || "Sheet1";
  }
}
