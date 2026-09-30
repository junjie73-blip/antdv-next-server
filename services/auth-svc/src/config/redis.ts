import { Redis } from "ioredis";
import { env } from "./env.js";
import { logger } from "./logger.js";

const options = {
  maxRetriesPerRequest: null as null,
  retryStrategy(times: number) {
    return Math.min(times * 200, 5000);
  },
  commandTimeout: 5000,
  keepAlive: 10_000,
} as const;

export const redis = new Redis(env.REDIS_URL, options);

redis.on("ready", () => logger.info("[redis] ready"));
redis.on("error", (err) => logger.error({ err }, "[redis] error"));

export async function closeRedis(): Promise<void> {
  await redis.quit().catch(() => {});
}
