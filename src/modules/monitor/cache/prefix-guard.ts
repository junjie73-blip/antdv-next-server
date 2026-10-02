import { AppError } from "@/core/errors.js";
import { CACHE_GROUPS, FORBIDDEN_CLEAR_PREFIXES } from "@/config/constants.js";

/** 允许操作的前缀（来自 CACHE_GROUPS） */
const ALLOWED_PREFIXES = CACHE_GROUPS.map((g) => g.prefix);
const MIN_PREFIX_LENGTH = 4;
/**
 * 显式禁止的前缀：会话/令牌/锁/队列等敏感数据
 * 这些 key 一旦被读取/清空，直接影响认证与限流
 */
const FORBIDDEN_PREFIXES = [
  "access:",
  "refresh:",
  "session:",
  "bull:",
  "rate-limit:",
  "rbac:",
  "login:fail:",
  "login:lock:",
  "user:force-logout:",
  "kicked:",
  "upload:",
];

export function assertSafePrefix(prefix: string): void {
  if (!prefix || typeof prefix !== "string") {
    throw new AppError("缺少前缀", 400001, 400);
  }
  if (prefix.length < MIN_PREFIX_LENGTH) {
    throw new AppError(`前缀长度至少 ${MIN_PREFIX_LENGTH} 个字符`, 400001, 400);
  }
  if (!/^[a-zA-Z][a-zA-Z0-9:_-]*$/.test(prefix)) {
    throw new AppError(`前缀格式非法`, 400001, 400);
  }

  // 黑名单：只判断 prefix 是否命中
  for (const f of FORBIDDEN_PREFIXES) {
    if (prefix.startsWith(f)) {
      throw new AppError(`前缀 ${prefix} 不允许操作`, 403001, 403);
    }
  }

  // 白名单：只判断 prefix 是否以某个白名单前缀开头
  const allowed = ALLOWED_PREFIXES.some((p) => prefix.startsWith(p));
  if (!allowed) {
    throw new AppError(`前缀 ${prefix} 不在白名单`, 403001, 403);
  }
}

export function assertSafeKey(key: string): void {
  if (!key || typeof key !== "string") {
    throw new AppError("缺少 key", 400001, 400);
  }
  for (const f of FORBIDDEN_PREFIXES) {
    if (key.startsWith(f)) {
      throw new AppError(`key ${key} 不允许访问`, 403001, 403);
    }
  }
}
export function assertGroupAllowed(group: string): void {
  const g = CACHE_GROUPS.find((x) => x.name === group);
  if (!g) {
    throw new AppError(`未知缓存组：${group}`, 400001, 400);
  }
  if (FORBIDDEN_CLEAR_PREFIXES.some((p) => g.prefix.startsWith(p))) {
    throw new AppError(`缓存组「${group}」禁止清空`, 403001, 403);
  }
}

export function assertKeyScannable(pattern: string): void {
  if (pattern.length < 3) {
    throw new AppError("pattern 至少 3 个字符", 400001, 400);
  }
  if (pattern === "*" || pattern.startsWith("*")) {
    throw new AppError("禁止全库扫描", 400001, 400);
  }
  if (FORBIDDEN_CLEAR_PREFIXES.some((p) => pattern.startsWith(p))) {
    throw new AppError("禁止操作敏感前缀", 403001, 403);
  }
}

export function groupPrefix(group: string): string {
  const g = CACHE_GROUPS.find((x) => x.name === group);
  if (!g) throw new AppError(`未知缓存组：${group}`, 400001, 400);
  return g.prefix;
}
