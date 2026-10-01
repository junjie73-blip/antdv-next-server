import PDFDocument from "pdfkit";
import type { ReportColumn, ReportConfig } from "../types.js";
import type PDFKit from "pdfkit";
export interface PdfExportOptions {
  title: string;
  columns: ReportColumn[];
  rows: Record<string, any>[];
  summary?: Record<string, any>;
  config?: ReportConfig;
  meta?: {
    userName?: string;
    tenantName?: string;
    generatedAt?: Date;
  };
  /** 中文字体路径（必须） */
  fontPath?: string;
}

const ROW_HEIGHT = 22;
const HEADER_HEIGHT = 26;
const MARGIN = 30;
const FONT_SIZE_BODY = 9;
const FONT_SIZE_HEADER = 10;

export class PdfExporter {
  static async export(options: PdfExportOptions): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const landscape = options.columns.length > 6;

        const doc = new PDFDocument({
          size: "A4",
          layout: landscape ? "landscape" : "portrait",
          margin: MARGIN,
          bufferPages: true,
          info: {
            Title: options.title,
            Author: options.meta?.userName ?? "SaaS Admin",
            CreationDate: new Date(),
          },
        });

        const chunks: Buffer[] = [];
        doc.on("data", (chunk: Buffer) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // 注册中文字体
        if (options.fontPath) {
          try {
            doc.registerFont("Chinese", options.fontPath);
            doc.font("Chinese");
          } catch (err) {
            // 字体加载失败时降级
          }
        }

        // ============ 1. 标题 ============
        doc.fontSize(16).fillColor("#1a1a1a").text(options.title, {
          align: "center",
        });
        doc.moveDown(0.3);

        // ============ 2. 元信息 ============
        if (options.meta) {
          const metaText = [
            options.meta.tenantName && `租户：${options.meta.tenantName}`,
            options.meta.userName && `导出人：${options.meta.userName}`,
            `导出时间：${(options.meta.generatedAt ?? new Date()).toLocaleString("zh-CN")}`,
          ]
            .filter(Boolean)
            .join("  |  ");

          doc
            .fontSize(8)
            .fillColor("#666666")
            .text(metaText, { align: "right" });
          doc.moveDown(0.5);
        }

        // ============ 3. 表格 ============
        this.drawTable(doc, options);

        // ============ 4. 页码 ============
        this.drawPageNumbers(doc);

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  private static drawTable(
    doc: PDFKit.PDFDocument,
    options: PdfExportOptions,
  ): void {
    const { columns, rows } = options;

    const pageWidth = doc.page.width - MARGIN * 2;
    const totalCols = columns.length;

    // 计算列宽
    const widths = this.computeColumnWidths(columns, rows, pageWidth);

    let currentY = doc.y;

    // 表头
    currentY = this.drawHeader(doc, columns, widths, currentY, pageWidth);

    // 数据行
    const zebra = options.config?.style?.zebra ?? true;

    rows.forEach((row, idx) => {
      // 分页
      if (currentY + ROW_HEIGHT > doc.page.height - MARGIN - 20) {
        doc.addPage();
        currentY = MARGIN;
        currentY = this.drawHeader(doc, columns, widths, currentY, pageWidth);
      }

      // 斑马纹
      if (zebra && idx % 2 === 1) {
        doc.rect(MARGIN, currentY, pageWidth, ROW_HEIGHT).fill("#FAFBFC");
      }

      // 边框
      doc
        .strokeColor("#E5E6EB")
        .lineWidth(0.5)
        .rect(MARGIN, currentY, pageWidth, ROW_HEIGHT)
        .stroke();

      // 单元格
      let x = MARGIN;
      doc.fillColor("#333333").fontSize(FONT_SIZE_BODY);

      columns.forEach((col, i) => {
        const value = this.format(row[col.key], col.type);
        const align = col.align ?? (col.type === "number" ? "right" : "left");

        doc.text(value, x + 4, currentY + 6, {
          width: widths[i] - 8,
          height: ROW_HEIGHT - 4,
          align,
          ellipsis: true,
          lineBreak: false,
        });

        x += widths[i];
      });

      currentY += ROW_HEIGHT;
    });

    // 汇总行
    if (options.summary) {
      if (currentY + ROW_HEIGHT > doc.page.height - MARGIN - 20) {
        doc.addPage();
        currentY = MARGIN;
        currentY = this.drawHeader(doc, columns, widths, currentY, pageWidth);
      }

      doc.rect(MARGIN, currentY, pageWidth, ROW_HEIGHT).fill("#FFF7E6");
      doc
        .strokeColor("#E5E6EB")
        .lineWidth(0.5)
        .rect(MARGIN, currentY, pageWidth, ROW_HEIGHT)
        .stroke();

      let x = MARGIN;
      doc.fillColor("#1a1a1a").fontSize(FONT_SIZE_BODY);

      columns.forEach((col, i) => {
        let text = "";
        if (i === 0) {
          text = "合计";
        } else {
          const val = options.summary![col.key];
          if (val !== undefined) {
            text = this.format(val, col.type);
          }
        }

        const align = col.align ?? (col.type === "number" ? "right" : "left");
        doc.text(text, x + 4, currentY + 6, {
          width: widths[i] - 8,
          height: ROW_HEIGHT - 4,
          align,
          ellipsis: true,
          lineBreak: false,
        });

        x += widths[i];
      });

      currentY += ROW_HEIGHT;
    }

    doc.y = currentY;
  }

  private static drawHeader(
    doc: PDFKit.PDFDocument,
    columns: ReportColumn[],
    widths: number[],
    y: number,
    pageWidth: number,
  ): number {
    // 背景
    doc.rect(MARGIN, y, pageWidth, HEADER_HEIGHT).fill("#F0F2F5");
    doc
      .strokeColor("#D9D9D9")
      .lineWidth(0.5)
      .rect(MARGIN, y, pageWidth, HEADER_HEIGHT)
      .stroke();

    // 文本
    let x = MARGIN;
    doc.fillColor("#1a1a1a").fontSize(FONT_SIZE_HEADER);

    columns.forEach((col, i) => {
      const align = col.align ?? (col.type === "number" ? "right" : "left");
      doc.text(col.label, x + 4, y + 8, {
        width: widths[i] - 8,
        align,
        ellipsis: true,
        lineBreak: false,
      });
      x += widths[i];
    });

    return y + HEADER_HEIGHT;
  }

  /**
   * 根据内容计算列宽
   */
  private static computeColumnWidths(
    columns: ReportColumn[],
    rows: Record<string, any>[],
    pageWidth: number,
  ): number[] {
    // 1. 基础权重
    const weights = columns.map((col) => {
      if (col.width) return col.width;

      // 根据表头和数据推断
      let maxLen = this.displayWidth(col.label);
      const sample = rows.slice(0, 50);
      for (const row of sample) {
        const val = this.format(row[col.key], col.type);
        const w = this.displayWidth(val);
        if (w > maxLen) maxLen = w;
      }

      return Math.max(6, Math.min(maxLen, 40));
    });

    // 2. 按比例缩放到页面宽度
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const scale = pageWidth / totalWeight;

    return weights.map((w) => w * scale);
  }

  /**
   * 显示宽度（中文算 2）
   */
  private static displayWidth(text: string): number {
    let width = 0;
    for (const ch of String(text)) {
      width += ch.charCodeAt(0) > 255 ? 2 : 1;
    }
    return width;
  }

  /**
   * 页码
   */
  private static drawPageNumbers(doc: PDFKit.PDFDocument): void {
    const range = doc.bufferedPageRange();
    const total = range.count;

    for (let i = 0; i < total; i++) {
      doc.switchToPage(range.start + i);

      const bottom = doc.page.height - MARGIN + 10;
      const pageWidth = doc.page.width - MARGIN * 2;

      doc
        .fontSize(8)
        .fillColor("#999999")
        .text(`第 ${i + 1} 页 / 共 ${total} 页`, MARGIN, bottom, {
          align: "center",
          width: pageWidth,
        });
    }
  }

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
