import { AppError } from "@/core/errors.js";
import { CACHE_GROUPS } from "@/config/constants.js";

/** 允许操作的前缀（来自 CACHE_GROUPS） */
const ALLOWED_PREFIXES = CACHE_GROUPS.map((g) => g.prefix);

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
  if (!prefix) throw new AppError("缺少前缀", 400001, 400);

  for (const f of FORBIDDEN_PREFIXES) {
    if (prefix.startsWith(f) || f.startsWith(prefix)) {
      throw new AppError(`前缀 ${prefix} 不允许操作`, 403001, 403);
    }
  }

  const allowed = ALLOWED_PREFIXES.some(
    (p) => prefix.startsWith(p) || p.startsWith(prefix),
  );
  if (!allowed) {
    throw new AppError(`前缀 ${prefix} 不在白名单`, 403001, 403);
  }
}

export function assertSafeKey(key: string): void {
  if (!key) throw new AppError("缺少 key", 400001, 400);
  for (const f of FORBIDDEN_PREFIXES) {
    if (key.startsWith(f)) {
      throw new AppError(`key ${key} 不允许访问`, 403001, 403);
    }
  }
}
