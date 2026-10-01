import { Readable } from "node:stream";
import type { ReportColumn } from "../types.js";

export interface CsvExportOptions {
  columns: ReportColumn[];
  rows: Record<string, any>[];
  /** 是否加 BOM（Excel 打开中文不乱码） */
  bom?: boolean;
}

export class CsvExporter {
  /**
   * 生成 CSV 字符串
   */
  static export(options: CsvExportOptions): string {
    const { columns, rows, bom = true } = options;

    const lines: string[] = [];

    // 表头
    lines.push(columns.map((c) => this.escape(c.label)).join(","));

    // 数据行
    for (const row of rows) {
      const line = columns
        .map((c) => this.escape(this.format(row[c.key], c.type)))
        .join(",");
      lines.push(line);
    }

    const content = lines.join("\r\n");
    return bom ? "\uFEFF" + content : content;
  }

  /**
   * 流式导出（大文件友好）
   */
  static exportStream(options: CsvExportOptions): Readable {
    const { columns, rows, bom = true } = options;

    let index = 0;
    const self = this;

    const stream = new Readable({
      read() {
        // 首块：BOM + 表头
        if (index === 0) {
          const header =
            (bom ? "\uFEFF" : "") +
            columns.map((c) => self.escape(c.label)).join(",") +
            "\r\n";
          this.push(header);
        }

        // 逐行推
        while (index < rows.length) {
          const row = rows[index];
          const line =
            columns
              .map((c) => self.escape(self.format(row[c.key], c.type)))
              .join(",") + "\r\n";

          index++;

          // 每 1000 行让出一次事件循环
          if (index % 1000 === 0) {
            this.push(line);
            return;
          }

          this.push(line);
        }

        this.push(null);
      },
    });

    return stream;
  }

  /**
   * CSV 转义
   */
  private static escape(value: any): string {
    if (value === null || value === undefined) return "";

    const str = String(value);

    // 含逗号、双引号、换行时，用双引号包裹
    if (
      str.includes(",") ||
      str.includes('"') ||
      str.includes("\n") ||
      str.includes("\r")
    ) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  }

  /**
   * 格式化值
   */
  private static format(value: any, type?: string): string {
    if (value === null || value === undefined) return "";

    if (type === "date") {
      const d = new Date(value);
      return isNaN(d.getTime()) ? String(value) : d.toLocaleString("zh-CN");
    }

    if (type === "boolean") {
      return value ? "是" : "否";
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  }
}
