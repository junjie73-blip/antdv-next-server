import { redis } from "@/config/redis.js";
import { delChunked } from "@/core/cache/redis-client.js";
import {
  CACHE_GROUPS,
  KEY_PREFIX_MAX_DEPTH,
  KEY_SEPARATOR,
  SCAN_BATCH_SIZE,
  SCAN_MAX_KEYS,
  UNCLASSIFIED_REMARK,
} from "@/config/constants.js";
import { assertSafePrefix } from "./prefix-guard.js";

export interface CacheInfo {
  redisVersion: string;
  redisMode: string;
  os: string;
  archBits: number;
  multiplexingApi: string;
  processId: number;
  runId: string;
  tcpPort: number;
  uptimeDays: number;
  connectedClients: number;
  usedMemory: number;
  usedMemoryHuman: string;
  usedMemoryRss: number;
  usedMemoryRssHuman: string;
  usedMemoryPeak: number;
  usedMemoryPeakHuman: string;
  usedMemoryLua: number;
  usedMemoryLuaHuman: string;
  maxMemory: number;
  maxMemoryHuman: string;
  maxMemoryPolicy: string;
  totalConnectionsReceived: number;
  totalCommandsProcessed: number;
  instantaneousOpsPerSec: number;
  keyspaceHits: number;
  keyspaceMisses: number;
  hitRate: string;
  latestForkUsec: number;
  totalNetInputBytes: number;
  totalNetOutputBytes: number;
  rejectedConnections: number;
  syncFull: number;
  syncPartialOk: number;
  expiredKeys: number;
  evictedKeys: number;
  dbKeys: number;
  dbSize: number;
}

export interface CacheGroupInfo {
  name: string;
  prefix: string;
  remark: string;
  count: number;
  discovered?: boolean;
}

export interface CacheKeyInfo {
  key: string;
  ttl: number;
  type: string;
}

export interface CacheKeyValue {
  key: string;
  type: string;
  ttl: number;
  value: unknown;
  total?: number;
  truncated?: boolean;
}

const SORTED_RULES = [...CACHE_GROUPS].sort(
  (a, b) => b.prefix.length - a.prefix.length,
);

function parseInfo(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    result[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return result;
}

function toNumber(v: string | undefined, def = 0): number {
  if (v === undefined) return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function extractPrefix(key: string, _maxDepth = KEY_PREFIX_MAX_DEPTH): string {
  for (const rule of SORTED_RULES) {
    if (key.startsWith(rule.prefix)) return rule.prefix;
  }
  const parts = key.split(KEY_SEPARATOR);
  const depth = Math.min(KEY_PREFIX_MAX_DEPTH, Math.max(1, parts.length - 1));
  return parts.slice(0, depth).join(KEY_SEPARATOR) + KEY_SEPARATOR;
}

function findRemark(prefix: string): string {
  const byRule = CACHE_GROUPS.find((r) => r.prefix === prefix);
  return byRule?.remark ?? UNCLASSIFIED_REMARK;
}

export class CacheRepository {
  async info(): Promise<CacheInfo> {
    const [server, clients, memory, stats, keyspace] = await Promise.all([
      redis.info("server"),
      redis.info("clients"),
      redis.info("memory"),
      redis.info("stats"),
      redis.info("keyspace"),
    ]);

    const info = {
      ...parseInfo(server),
      ...parseInfo(clients),
      ...parseInfo(memory),
      ...parseInfo(stats),
    };

    const hits = toNumber(info.keyspace_hits);
    const misses = toNumber(info.keyspace_misses);
    const total = hits + misses;
    const hitRate = total > 0 ? ((hits / total) * 100).toFixed(2) : "0.00";

    let dbKeys = 0;
    const ks = parseInfo(keyspace);
    for (const key of Object.keys(ks)) {
      const m = ks[key].match(/keys=(\d+)/);
      if (m) dbKeys += Number(m[1]);
    }

    return {
      redisVersion: info.redis_version || "-",
      redisMode: info.redis_mode || "standalone",
      os: info.os || "-",
      archBits: toNumber(info.arch_bits),
      multiplexingApi: info.multiplexing_api || "-",
      processId: toNumber(info.process_id),
      runId: info.run_id || "-",
      tcpPort: toNumber(info.tcp_port),
      uptimeDays: toNumber(info.uptime_in_days),
      connectedClients: toNumber(info.connected_clients),
      usedMemory: toNumber(info.used_memory),
      usedMemoryHuman: info.used_memory_human || "-",
      usedMemoryRss: toNumber(info.used_memory_rss),
      usedMemoryRssHuman: info.used_memory_rss_human || "-",
      usedMemoryPeak: toNumber(info.used_memory_peak),
      usedMemoryPeakHuman: info.used_memory_peak_human || "-",
      usedMemoryLua: toNumber(info.used_memory_lua),
      usedMemoryLuaHuman: info.used_memory_lua_human || "-",
      maxMemory: toNumber(info.maxmemory),
      maxMemoryHuman: info.maxmemory_human || "-",
      maxMemoryPolicy: info.maxmemory_policy || "noeviction",
      totalConnectionsReceived: toNumber(info.total_connections_received),
      totalCommandsProcessed: toNumber(info.total_commands_processed),
      instantaneousOpsPerSec: toNumber(info.instantaneous_ops_per_sec),
      keyspaceHits: hits,
      keyspaceMisses: misses,
      hitRate,
      latestForkUsec: toNumber(info.latest_fork_usec),
      totalNetInputBytes: toNumber(info.total_net_input_bytes),
      totalNetOutputBytes: toNumber(info.total_net_output_bytes),
      rejectedConnections: toNumber(info.rejected_connections),
      syncFull: toNumber(info.sync_full),
      syncPartialOk: toNumber(info.sync_partial_ok),
      expiredKeys: toNumber(info.expired_keys),
      evictedKeys: toNumber(info.evicted_keys),
      dbKeys,
      dbSize: dbKeys,
    };
  }

  async getGroupList(): Promise<CacheGroupInfo[]> {
    const knownGroups = new Map<string, CacheGroupInfo>();
    for (const g of CACHE_GROUPS) {
      knownGroups.set(g.prefix, { ...g, count: 0, discovered: false });
    }

    const dynamicCounts = new Map<string, number>();
    let cursor = "0";
    let scanned = 0;

    try {
      do {
        const [next, keys] = await redis.scan(
          cursor,
          "MATCH",
          "*",
          "COUNT",
          SCAN_BATCH_SIZE,
        );
        cursor = next;

        for (const key of keys) {
          scanned++;
          const exact = CACHE_GROUPS.find((g) => key.startsWith(g.prefix));
          if (exact) {
            const entry = knownGroups.get(exact.prefix);
            if (entry) entry.count++;
            continue;
          }
          const prefix = extractPrefix(key);
          dynamicCounts.set(prefix, (dynamicCounts.get(prefix) ?? 0) + 1);
        }

        if (scanned >= SCAN_MAX_KEYS) break;
      } while (cursor !== "0");
    } catch (e) {
      console.warn("[cache] SCAN failed:", e);
    }

    const result: CacheGroupInfo[] = Array.from(knownGroups.values());
    for (const [prefix, count] of dynamicCounts) {
      const name = prefix.endsWith(KEY_SEPARATOR)
        ? prefix.slice(0, -KEY_SEPARATOR.length)
        : prefix;
      result.push({
        name,
        prefix,
        remark: findRemark(prefix),
        count,
        discovered: true,
      });
    }

    result.sort((a, b) => {
      if (a.discovered !== b.discovered) return a.discovered ? 1 : -1;
      if (a.discovered && b.discovered) return b.count - a.count;
      return 0;
    });
    return result;
  }

  async getKeys(prefix: string, limit = 500): Promise<CacheKeyInfo[]> {
    assertSafePrefix(prefix);

    const keys: string[] = [];
    let cursor = "0";
    try {
      do {
        const [next, batch] = await redis.scan(
          cursor,
          "MATCH",
          `${prefix}*`,
          "COUNT",
          500,
        );
        cursor = next;
        keys.push(...batch);
        if (keys.length >= limit) break;
      } while (cursor !== "0");
    } catch (e) {
      console.warn(`[cache] scan ${prefix}* failed:`, e);
      return [];
    }

    const sliced = keys.slice(0, limit);
    return Promise.all(
      sliced.map(async (key) => {
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
  }

  async getValue(key: string, limit = 200): Promise<CacheKeyValue> {
    assertSafePrefix(key);

    const type = String(await redis.type(key));
    if (type === "none") throw new Error(`Key "${key}" 不存在`);

    const ttl = Number(await redis.ttl(key));
    let value: unknown = null;
    let total: number | undefined;
    let truncated = false;

    try {
      switch (type) {
        case "string": {
          const raw = await redis.get(key);
          const text = typeof raw === "string" ? raw : JSON.stringify(raw);
          total = text?.length ?? 0;
          if (text && text.length > 10_000) {
            value = text.slice(0, 10_000);
            truncated = true;
          } else {
            value = raw;
          }
          break;
        }
        case "list": {
          total = Number(await redis.llen(key));
          value = await redis.lrange(key, 0, limit - 1);
          truncated = (total ?? 0) > limit;
          break;
        }
        case "set": {
          total = Number(await redis.scard(key));
          const members = await redis.smembers(key);
          value = members.slice(0, limit);
          truncated = members.length > limit;
          break;
        }
        case "zset": {
          total = Number(await redis.zcard(key));
          value = await redis.zrange(key, 0, String(limit - 1), "WITHSCORES");
          truncated = (total ?? 0) > limit;
          break;
        }
        case "hash": {
          total = Number(await redis.hlen(key));
          value = await redis.hgetall(key);
          break;
        }
        default:
          value = `不支持的 key 类型: ${type}`;
      }
    } catch (e) {
      value = `读取失败: ${(e as Error).message}`;
    }

    return { key, type, ttl, value, total, truncated };
  }

  async deleteKey(key: string): Promise<void> {
    assertSafePrefix(key);
    await redis.del(key);
  }

  async clearByPrefix(prefix: string): Promise<number> {
    assertSafePrefix(prefix);

    let count = 0;
    let cursor = "0";
    do {
      const [next, keys] = await redis.scan(
        cursor,
        "MATCH",
        `${prefix}*`,
        "COUNT",
        500,
      );
      cursor = next;
      if (keys.length > 0) {
        count += await delChunked(keys);
      }
    } while (cursor !== "0");
    return count;
  }

  /** ⚠️ clearAll 已禁用：只允许按组清理，禁止 flushdb */
  async clearAll(): Promise<void> {
    throw new Error("clearAll 已禁用，请使用 clearByPrefix 按组清理");
  }
}
