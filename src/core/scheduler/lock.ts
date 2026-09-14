import { redis } from "@/config/redis.js";
import { randomUUID } from "node:crypto";

/** 释放锁：只有持有者才能删 */
const RELEASE_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

export interface LockHandle {
  key: string;
  token: string;
}

/**
 * 尝试获取锁
 * @param key 锁名
 * @param ttlSeconds 过期时间（防止死锁）
 * @returns 成功返回 { key, token }，失败返回 null
 */
export async function tryAcquireLock(
  key: string,
  ttlSeconds: number,
): Promise<LockHandle | null> {
  const token = randomUUID();
  const ok = await redis.set(key, token, "EX", ttlSeconds, "NX");
  return ok === "OK" ? { key, token } : null;
}

/** 释放锁（Lua 保证原子性） */
export async function releaseLock(handle: LockHandle): Promise<void> {
  try {
    await redis.eval(RELEASE_SCRIPT, 1, handle.key, handle.token);
  } catch {
    // 释放失败由 TTL 兜底
  }
}

/**
 * 包装：自动获取锁 → 执行 → 释放
 * @returns 未抢到锁时返回 null，抢到则返回执行结果
 */
export async function withLock<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T | null> {
  const handle = await tryAcquireLock(key, ttlSeconds);
  if (!handle) return null;
  try {
    return await fn();
  } finally {
    await releaseLock(handle);
  }
}
