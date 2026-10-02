import { redis } from "@/config/redis.js";
import { AppError } from "@/core/errors.js";
import { scanAll } from "@/core/cache/redis-client.js";
import { CACHE_GROUPS } from "@/config/constants.js";
import {
  assertGroupAllowed,
  assertKeyScannable,
  groupPrefix,
} from "../prefix-guard.js";
import { SCAN_BATCH, SCAN_MAX } from "../constants.js";
import type {
  CacheScanDTO,
  CacheClearGroupDTO,
  CacheDeleteKeyDTO,
} from "../schema.js";

export class CacheService {
  /* ============================================================
   * 概览
   * ============================================================ */
  async overview() {
    const dbsize = await redis.dbsize();

    // 每个组的样本 key 数（最多取 1000）
    const groups = await Promise.all(
      CACHE_GROUPS.map(async (g) => {
        try {
          const keys = await scanAll(`${g.prefix}*`, SCAN_BATCH, 1000);
          return {
            name: g.name,
            prefix: g.prefix,
            remark: g.remark,
            sampleCount: keys.length,
          };
        } catch {
          return {
            name: g.name,
            prefix: g.prefix,
            remark: g.remark,
            sampleCount: 0,
          };
        }
      }),
    );

    return { total: dbsize, groups };
  }

  /* ============================================================
   * 按 pattern 扫描
   * ============================================================ */
  async scan(dto: CacheScanDTO) {
    assertKeyScannable(dto.pattern);
    const keys = await scanAll(
      dto.pattern,
      SCAN_BATCH,
      Math.min(dto.limit, SCAN_MAX),
    );
    const details = await Promise.all(
      keys.slice(0, dto.limit).map(async (k) => {
        const [ttl, type] = await Promise.all([redis.ttl(k), redis.type(k)]);
        return { key: k, ttl, type };
      }),
    );
    return { keys: details, total: keys.length };
  }

  /* ============================================================
   * 清空缓存组
   * ============================================================ */
  async clearGroup(dto: CacheClearGroupDTO) {
    assertGroupAllowed(dto.group);
    const prefix = groupPrefix(dto.group);

    const keys = await scanAll(`${prefix}*`, SCAN_BATCH, SCAN_MAX);
    if (keys.length === 0) return { cleared: 0 };

    // 分块删除
    let total = 0;
    for (let i = 0; i < keys.length; i += SCAN_BATCH) {
      const chunk = keys.slice(i, i + SCAN_BATCH);
      total += await redis.del(...chunk);
    }
    return { cleared: total };
  }

  /* ============================================================
   * 删除单 key
   * ============================================================ */
  async deleteKey(dto: CacheDeleteKeyDTO) {
    assertKeyScannable(dto.key);
    const n = await redis.del(dto.key);
    return { deleted: n };
  }

  /* ============================================================
   * 详情
   * ============================================================ */
  async keyDetail(key: string) {
    assertKeyScannable(key);
    const [type, ttl] = await Promise.all([redis.type(key), redis.ttl(key)]);
    if (type === "none") throw new AppError("key 不存在", 404001, 404);

    let value: unknown;
    if (type === "string") {
      const raw = await redis.get(key);
      value = raw && raw.length > 500 ? raw.slice(0, 500) + "…" : raw;
    } else if (type === "hash") {
      value = await redis.hgetall(key);
    } else if (type === "list") {
      value = await redis.lrange(key, 0, 49);
    } else if (type === "set") {
      value = await redis.smembers(key);
    } else if (type === "zset") {
      value = await redis.zrange(key, 0, "49", "WITHSCORES");
    }

    return { key, type, ttl, value };
  }
}

export const cacheService = new CacheService();
