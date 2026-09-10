import { redis } from "@/config/redis.js";

export class CacheRepository {
  async info() {
    // Upstash 提供 info 命令
    const raw = await redis.info();
    const lines = String(raw).split("\n");
    const map: Record<string, string> = {};
    for (const line of lines) {
      const [k, v] = line.split(":");
      if (k && v) map[k.trim()] = v.trim();
    }
    return {
      version: map.redis_version,
      mode: map.redis_mode,
      uptime: Number(map.uptime_in_seconds || 0),
      connectedClients: Number(map.connected_clients || 0),
      usedMemory: Number(map.used_memory || 0),
      usedMemoryHuman: map.used_memory_human,
      totalCommands: Number(map.total_commands_processed || 0),
      hits: Number(map.keyspace_hits || 0),
      misses: Number(map.keyspace_misses || 0),
      hitRate: (() => {
        const h = Number(map.keyspace_hits || 0);
        const m = Number(map.keyspace_misses || 0);
        return h + m > 0 ? ((h / (h + m)) * 100).toFixed(2) : "0.00";
      })(),
      dbKeys: map.db0 ? Number(map.db0.split(",")[0].split("=")[1]) : 0,
    };
  }

  async keys(pattern = "*", limit = 100) {
    const keys: { key: string; ttl: number; type: string }[] = [];
    let cursor = "0";
    do {
      const [next, batch] = await redis.scan(cursor, {
        match: pattern,
        count: 100,
      });
      cursor = next;
      for (const key of batch) {
        if (keys.length >= limit) break;
        const [ttl, type] = await Promise.all([
          redis.ttl(key),
          redis.type(key),
        ]);
        keys.push({ key, ttl, type });
      }
    } while (cursor !== "0" && keys.length < limit);
    return keys;
  }

  async deleteKey(key: string) {
    await redis.del(key);
  }

  async clear() {
    await redis.flushdb();
  }
}
