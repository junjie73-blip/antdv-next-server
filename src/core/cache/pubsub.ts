import { redis, subRedis } from "@/config/redis.js";
import { logger } from "@/platform/logger/index.js";

const PREFIX = "cache:invalid:";

export async function publishInvalidate(
  namespace: string,
  key = "",
): Promise<void> {
  try {
    await redis.publish(`${PREFIX}${namespace}`, key);
  } catch (err) {
    logger.warn({ err, namespace, key }, "cache invalid publish failed");
  }
}

export function subscribeInvalidate(
  namespace: string,
  handler: (key: string) => void,
): void {
  const channel = `${PREFIX}${namespace}`;
  void subRedis.subscribe(channel);
  subRedis.on("message", (ch, msg) => {
    if (ch === channel) handler(msg);
  });
}
