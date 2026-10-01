import { ExcelExporter } from "./excel.exporter.js";
import { CsvExporter } from "./csv.exporter.js";
import { HtmlExporter } from "./html.exporter.js";
import { PdfExporter } from "./pdf.exporter.js";
import type { ExportType } from "../types.js";

export interface ExportResult {
  buffer: Buffer;
  contentType: string;
  extension: string;
}

export class ExportFactory {
  /**
   * 获取导出器的 MIME 类型
   */
  static getContentType(type: ExportType): string {
    switch (type) {
      case "excel":
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      case "csv":
        return "text/csv; charset=utf-8";
      case "html":
        return "text/html; charset=utf-8";
      case "pdf":
        return "application/pdf";
      default:
        return "application/octet-stream";
    }
  }

  static getExtension(type: ExportType): string {
    switch (type) {
      case "excel":
        return "xlsx";
      case "csv":
        return "csv";
      case "html":
        return "html";
      case "pdf":
        return "pdf";
      default:
        return "bin";
    }
  }
}

export { ExcelExporter, CsvExporter, HtmlExporter, PdfExporter };
