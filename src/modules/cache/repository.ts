import { redis } from "@/config/redis.js";

interface CacheKeyInfo {
  key: string;
  ttl: number;
  type: string;
}

export class CacheRepository {
  /**
   * 获取缓存概览信息
   * Upstash 不支持 INFO 命令，用 DBSIZE + 环境变量 + 估算值代替
   */
  async info() {
    // 1. key 总数（Upstash 支持 DBSIZE）
    let dbKeys = 0;
    try {
      dbKeys = await redis.dbsize();
    } catch (e) {
      console.warn("[cache] dbsize failed:", e);
    }

    // 2. 估算内存：Upstash 不提供 used_memory，用 key 数 * 平均大小估算
    const estimatedMemory = dbKeys * 512; // 假设每个 key 平均 512 字节

    // 3. 连接数、命中率等 Upstash 不直接暴露
    // 可以从环境变量或手动配置读取
    const connectedClients =
      Number(process.env.REDIS_MAX_CLIENTS || 0) || "N/A";

    return {
      provider: "Upstash Redis",
      version: "REST API",
      mode: "serverless",
      uptime: 0, // Upstash 无此概念
      connectedClients,
      usedMemory: estimatedMemory,
      usedMemoryHuman: formatBytes(estimatedMemory),
      totalCommands: "N/A",
      hits: "N/A",
      misses: "N/A",
      hitRate: "N/A",
      dbKeys,
      // Upstash 特有信息
      endpoint: maskUrl(process.env.UPSTASH_REDIS_REST_URL || ""),
      note: "Upstash 通过 REST API 提供服务，部分 Redis 原生指标不可用",
    };
  }

  /**
   * 获取 key 列表
   * 用 KEYS 替代 SCAN（Upstash 不支持 SCAN）
   * 注意：keys 数量大时性能会下降，建议加 pattern 过滤
   */
  async keys(pattern = "*", limit = 100): Promise<CacheKeyInfo[]> {
    let keyList: string[] = [];
    try {
      // Upstash 的 keys 返回 string[]
      const result = await redis.keys(pattern);
      keyList = Array.isArray(result) ? result : [];
    } catch (e) {
      console.warn("[cache] keys failed:", e);
      return [];
    }

    // 限制数量
    keyList = keyList.slice(0, limit);

    // 并发获取每个 key 的 ttl 和 type
    const result = await Promise.all(
      keyList.map(async (key) => {
        try {
          const [ttl, type] = await Promise.all([
            redis.ttl(key),
            redis.type(key),
          ]);
          return { key, ttl: Number(ttl), type: String(type) };
        } catch {
          return { key, ttl: -1, type: "unknown" };
        }
      }),
    );

    return result;
  }

  /**
   * 删除单个 key
   */
  async deleteKey(key: string) {
    await redis.del(key);
  }

  /**
   * 批量删除匹配的 key
   */
  async deleteByPattern(pattern: string): Promise<number> {
    const keys = await redis.keys(pattern);
    if (!Array.isArray(keys) || keys.length === 0) return 0;
    await redis.del(...keys);
    return keys.length;
  }

  /**
   * 清空缓存
   * Upstash 不支持 flushdb，用 flushall
   * ⚠️ 注意：flushall 会清空整个数据库，慎用
   */
  async clear() {
    // @upstash/redis 的 flushall 需要传 async 参数
    await redis.flushall();
  }
}

// ============ 工具函数 ============

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(2)} ${units[i]}`;
}

function maskUrl(url: string): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return url;
  }
}
