// src/modules/field-mask/matcher.ts
import { createHash } from "node:crypto";

export interface MaskContext {
  type: string; // phone | email | idCard | name | custom
  rule?: string | null; // custom 的正则
  replaceChar?: string; // 默认 '*'
  keepPrefix?: number; // 默认 3
  keepSuffix?: number; // 默认 4
}

export function applyMask(value: unknown, ctx: MaskContext): unknown {
  if (value === null || value === undefined) return value;

  const s = String(value);
  const ch = ctx.replaceChar ?? "*";
  const head = Math.max(0, ctx.keepPrefix ?? 3);
  const tail = Math.max(0, ctx.keepSuffix ?? 4);

  // 内置类型优先使用默认规则，避免用户配置不当
  switch (ctx.type) {
    case "phone":
      return keepHeadTail(s, 3, 4, ch);
    case "email":
      return maskEmail(s, ch);
    case "idCard":
      return keepHeadTail(s, 6, 4, ch);
    case "name":
      return maskName(s, ch);
    case "custom":
      return maskByRegex(s, ctx.rule ?? null, ch);
    default:
      return keepHeadTail(s, head, tail, ch);
  }
}

/** 保留首尾，中间替换 */
function keepHeadTail(
  s: string,
  head: number,
  tail: number,
  ch: string,
): string {
  if (s.length <= head + tail) return ch.repeat(s.length);
  return s.slice(0, head) + ch.repeat(s.length - head - tail) + s.slice(-tail);
}

/** 邮箱：保留 @ 前后各 2/1 位 */
function maskEmail(s: string, ch: string): string {
  const at = s.indexOf("@");
  if (at < 1) return ch.repeat(s.length);
  const local = s.slice(0, at);
  const domain = s.slice(at);
  if (local.length <= 2) return `${ch.repeat(local.length)}${domain}`;
  return `${local.slice(0, 2)}${ch.repeat(local.length - 2)}${domain}`;
}

/** 姓名：保留首字，其余替换 */
function maskName(s: string, ch: string): string {
  if (s.length <= 1) return s;
  return s[0] + ch.repeat(s.length - 1);
}

/** 自定义正则 */
function maskByRegex(s: string, rule: string | null, ch: string): string {
  if (!rule) return ch.repeat(s.length);
  try {
    const re = new RegExp(rule, "g");
    return s.replace(re, (m) => ch.repeat(m.length));
  } catch {
    return ch.repeat(s.length);
  }
}

/** 兼容旧接口（如其他地方引用了 hashMask） */
export function hashMask(s: string): string {
  return createHash("sha256").update(s).digest("hex").slice(0, 8);
}
