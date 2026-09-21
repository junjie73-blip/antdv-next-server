import { redis } from "@/config/redis.js";
import { logger } from "@/platform/logger/index.js";

export interface CachedOptions<T> {
  key: string;
  ttl: number;
  loader: () => Promise<T>;
  /** 空值缓存时长（防穿透），默认 30s */
  nullTtl?: number;
}

export async function cached<T>({
  key,
  ttl,
  loader,
  nullTtl = 30,
}: CachedOptions<T>): Promise<T> {
  try {
    const hit = await redis.get(key);
    if (hit !== null) return JSON.parse(hit) as T;
  } catch (err) {
    logger.warn({ err, key }, "cache get failed, fallback to loader");
  }

  const value = await loader();
  try {
    if (value == null) {
      await redis.setex(key, nullTtl, JSON.stringify(null)); // ⭐ 空值缓存防穿透
    } else {
      await redis.setex(key, ttl, JSON.stringify(value));
    }
  } catch (err) {
    logger.warn({ err, key }, "cache set failed");
  }
  return value;
}
