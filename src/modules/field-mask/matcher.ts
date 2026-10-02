import { createHash } from "node:crypto";
import { MASK_TYPE } from "./constants.js";

export interface MaskContext {
  type: string;
  rule?: string | null;
}

export function applyMask(value: unknown, ctx: MaskContext): unknown {
  if (value === null || value === undefined) return value;

  const s = String(value);

  switch (ctx.type) {
    case MASK_TYPE.FULL:
      return "*".repeat(Math.min(s.length, 32));

    case MASK_TYPE.PARTIAL:
      return partialMask(s, ctx.rule);

    case MASK_TYPE.HASH:
      return hashMask(s);

    case MASK_TYPE.REGEX:
      return regexMask(s, ctx.rule);

    case MASK_TYPE.CUSTOM:
      return ctx.rule ?? "***";

    default:
      return "***";
  }
}

/** partial: 规则形如 "3,4" 表示首 3 尾 4；默认首 3 尾 4 */
function partialMask(s: string, rule?: string | null): string {
  const [headStr, tailStr] = (rule ?? "3,4").split(",");
  const head = Number(headStr) || 3;
  const tail = Number(tailStr) || 4;
  if (s.length <= head + tail) return "*".repeat(s.length);
  return s.slice(0, head) + "*".repeat(s.length - head - tail) + s.slice(-tail);
}

/** hash: 稳定可比较但不可逆 */
function hashMask(s: string): string {
  return createHash("sha256").update(s).digest("hex").slice(0, 8);
}

/** regex: 用 rule 作为正则，匹配部分替换为 * */
function regexMask(s: string, rule?: string | null): string {
  if (!rule) return "***";
  try {
    const re = new RegExp(rule, "g");
    return s.replace(re, "*");
  } catch {
    return "***";
  }
}

/**
 * 判断用户角色是否命中 policy
 * - role_scope = "all" 命中所有
 * - role_scope 是 JSON 数组字符串（["ADMIN","SUPER_ADMIN"]）命中其一
 */
export function matchRoleScope(
  roleScope: string,
  userRoles: string[],
): boolean {
  if (roleScope === "all") return true;
  try {
    const list = JSON.parse(roleScope) as string[];
    return list.some((r) => userRoles.includes(r));
  } catch {
    return false;
  }
}
