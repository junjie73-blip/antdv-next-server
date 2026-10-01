import { createHash } from "node:crypto";
import { redis } from "@/config/redis.js";
import { logger } from "@/platform/logger/index.js";
import type { ExecuteReportResult } from "../types.js";

const CACHE_PREFIX = "rp:cache:";
const DEFAULT_TTL = 300; // 5 分钟

export class ReportCache {
  /**
   * 构造缓存 key
   */
  static buildKey(
    tenantId: string,
    reportCode: string,
    params: Record<string, any>,
  ): string {
    const paramsHash = createHash("sha1")
      .update(JSON.stringify(this.stableStringify(params)))
      .digest("hex")
      .slice(0, 16);

    return `${CACHE_PREFIX}${tenantId}:${reportCode}:${paramsHash}`;
  }

  /**
   * 稳定序列化（保证相同对象得到相同字符串）
   */
  private static stableStringify(obj: any): string {
    if (obj === null || typeof obj !== "object") {
      return JSON.stringify(obj);
    }

    if (Array.isArray(obj)) {
      return `[${obj.map((v) => this.stableStringify(v)).join(",")}]`;
    }

    const keys = Object.keys(obj).sort();
    return `{${keys
      .map((k) => `${JSON.stringify(k)}:${this.stableStringify(obj[k])}`)
      .join(",")}}`;
  }

  /**
   * 读缓存
   */
  static async get(key: string): Promise<ExecuteReportResult | null> {
    try {
      const cached = await redis.get(key);
      if (!cached) return null;
      return JSON.parse(cached) as ExecuteReportResult;
    } catch (err: any) {
      logger.warn({ err, key }, "[report-cache] 读取失败");
      return null;
    }
  }

  /**
   * 写缓存
   */
  static async set(
    key: string,
    value: ExecuteReportResult,
    ttl: number = DEFAULT_TTL,
  ): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (err: any) {
      logger.warn({ err, key }, "[report-cache] 写入失败");
    }
  }

  /**
   * 清除指定报表的所有缓存
   */
  static async invalidate(tenantId: string, reportCode: string): Promise<void> {
    try {
      const pattern = `${CACHE_PREFIX}${tenantId}:${reportCode}:*`;
      const keys = await this.scanKeys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info(
          { count: keys.length, tenantId, reportCode },
          "[report-cache] 已清除",
        );
      }
    } catch (err: any) {
      logger.warn({ err, tenantId, reportCode }, "[report-cache] 清除失败");
    }
  }

  /**
   * 按 pattern 扫描 key
   */
  private static async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = "0";

    do {
      const [nextCursor, batch] = await redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100,
      );
      cursor = nextCursor;
      keys.push(...batch);
    } while (cursor !== "0");

    return keys;
  }
}
