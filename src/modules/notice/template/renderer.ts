import { marked } from "marked";
import { env } from "@/config/env.js";

/* ============================================================
 * 变量上下文
 * ============================================================ */
export interface TemplateRenderContext {
  userName?: string;
  realName?: string;
  deptName?: string;
  appName?: string;
  systemName?: string;
  now?: string;
  [key: string]: string | undefined;
}

/* ============================================================
 * 默认上下文（系统级变量）
 * ============================================================ */
export function buildDefaultContext(): TemplateRenderContext {
  return {
    appName: env.APP_NAME ?? "系统",
    systemName: env.SYSTEM_NAME ?? env.APP_NAME ?? "通知中心",
    now: formatNow(),
  };
}

function formatNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ============================================================
 * 变量替换
 * ============================================================ */
export function replaceVars(
  template: string,
  context: TemplateRenderContext,
): string {
  return (template ?? "").replace(/\$\{(\w+)\}/g, (_, key: string) => {
    const value = context[key];
    if (value === undefined || value === null || value === "") {
      // 未提供的变量保留原样，便于排查
      return `\${${key}}`;
    }
    return String(value);
  });
}

/* ============================================================
 * 提取变量名
 * ============================================================ */
export function extractVars(template: string): string[] {
  const set = new Set<string>();
  const regex = /\$\{(\w+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(template ?? "")) !== null) set.add(m[1]);
  return [...set];
}

/* ============================================================
 * 模板内容 → HTML（用于邮件正文）
 * ============================================================ */
export function renderTemplateToHtml(
  content: string,
  contentFormat: string,
  context: TemplateRenderContext,
): string {
  const rendered = replaceVars(content ?? "", context);

  switch (contentFormat) {
    case "html":
      return rendered;
    case "text":
      return escapeHtml(rendered).replace(/\n/g, "<br/>");
    case "markdown":
    default:
      try {
        return marked.parse(rendered, { breaks: true, gfm: true }) as string;
      } catch {
        return escapeHtml(rendered).replace(/\n/g, "<br/>");
      }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
