import { Redis } from "@upstash/redis";

const redisUrl = process.env.REDIS_URL || process.env.KV_REST_API_URL || "";
const redisToken =
  process.env.REDIS_TOKEN || process.env.KV_REST_API_TOKEN || "";

let redis: Redis;

if (redisUrl.startsWith("http")) {
  // Upstash REST API
  redis = new Redis({ url: redisUrl, token: redisToken });
} else {
  console.warn("[Redis] No valid Redis URL, using in-memory fallback");
  const memoryStore = new Map<string, string>();
  redis = {
    get: async (k: string) => memoryStore.get(k) || null,
    set: async (k: string, v: string) => {
      memoryStore.set(k, v);
      return "OK";
    },
    del: async (k: string) => {
      memoryStore.delete(k);
      return 1;
    },
    ping: async () => "PONG",
  } as any;
}

export { redis };
