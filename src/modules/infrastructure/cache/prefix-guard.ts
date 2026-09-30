import { AppError } from "@/core/errors.js";
import { CACHE_GROUPS } from "@/config/constants.js";

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
