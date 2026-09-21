import { redis } from "@/config/redis.js";
import { randomUUID } from "node:crypto";

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

export async function tryAcquireLock(
  key: string,
  ttlSeconds: number,
): Promise<LockHandle | null> {
  const token = randomUUID();
  const ok = await redis.set(key, token, "EX", ttlSeconds, "NX");
  return ok === "OK" ? { key, token } : null;
}

export async function releaseLock(handle: LockHandle): Promise<void> {
  try {
    await redis.eval(RELEASE_SCRIPT, 1, handle.key, handle.token);
  } catch {}
}

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
