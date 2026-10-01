import type { ReportColumn, ReportConfig } from "../types.js";

export interface HtmlExportOptions {
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
  /** 是否内联样式（用于邮件/PDF 转换） */
  inlineStyle?: boolean;
}

export class HtmlExporter {
  static export(options: HtmlExportOptions): string {
    const { columns, rows } = options;

    const headerHtml = columns
      .map((c) => `<th>${this.escape(c.label)}</th>`)
      .join("");

    const bodyHtml = rows
      .map((row, idx) => {
        const cells = columns
          .map((c) => {
            const val = this.format(row[c.key], c.type);
            const align = c.align ?? (c.type === "number" ? "right" : "left");
            return `<td style="text-align:${align}">${this.escape(val)}</td>`;
          })
          .join("");
        return `<tr class="${idx % 2 === 1 ? "zebra" : ""}">${cells}</tr>`;
      })
      .join("");

    // 汇总行
    let summaryHtml = "";
    if (options.summary) {
      const cells = columns
        .map((c, i) => {
          if (i === 0) return `<td><strong>合计</strong></td>`;
          const val = options.summary![c.key];
          if (val === undefined) return "<td></td>";
          const align = c.type === "number" ? "right" : "left";
          return `<td style="text-align:${align}"><strong>${this.escape(this.format(val, c.type))}</strong></td>`;
        })
        .join("");
      summaryHtml = `<tr class="summary">${cells}</tr>`;
    }

    const metaHtml = options.meta
      ? `
      <div class="meta">
        ${options.meta.tenantName ? `<span>租户：${this.escape(options.meta.tenantName)}</span>` : ""}
        ${options.meta.userName ? `<span>导出人：${this.escape(options.meta.userName)}</span>` : ""}
        <span>导出时间：${(options.meta.generatedAt ?? new Date()).toLocaleString("zh-CN")}</span>
      </div>`
      : "";

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${this.escape(options.title)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    margin: 0;
    padding: 24px;
    background: #f5f7fa;
    color: #333;
    font-size: 14px;
  }
  .container {
    max-width: 100%;
    margin: 0 auto;
    background: #fff;
    padding: 32px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }
  h1 { font-size: 22px; text-align: center; margin: 0 0 12px; color: #1a1a1a; }
  .meta {
    display: flex;
    justify-content: flex-end;
    gap: 24px;
    font-size: 12px;
    color: #666;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
  }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th {
    background: #f0f2f5;
    padding: 10px 12px;
    text-align: left;
    font-weight: 600;
    border: 1px solid #e5e6eb;
    white-space: nowrap;
    position: sticky;
    top: 0;
  }
  td {
    padding: 8px 12px;
    border: 1px solid #e5e6eb;
    word-break: break-all;
  }
  tr.zebra td { background: #fafbfc; }
  tr:hover td { background: #f0f7ff; }
  tr.summary td { background: #fff7e6; font-weight: 600; }
  @media print {
    body { background: #fff; padding: 0; }
    .container { box-shadow: none; padding: 0; }
    th { position: static; }
  }
</style>
</head>
<body>
  <div class="container">
    <h1>${this.escape(options.title)}</h1>
    ${metaHtml}
    <table>
      <thead><tr>${headerHtml}</tr></thead>
      <tbody>${bodyHtml}${summaryHtml}</tbody>
    </table>
  </div>
</body>
</html>`;
  }

  private static escape(str: any): string {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
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
