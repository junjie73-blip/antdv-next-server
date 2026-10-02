import { redis } from "@/config/redis.js";
import { logger } from "@/platform/logger/index.js";
import { BACKEND_CACHE_TTL } from "./constants.js";

const PREFIX = "storage-backend:";

function key(tenantId: string): string {
  return `${PREFIX}${tenantId}`;
}

export async function getActiveBackend(tenantId: string) {
  try {
    const raw = await redis.get(key(tenantId));
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    logger.warn({ err, tenantId }, "[storage-backend] cache get failed");
    return null;
  }
}

export async function setActiveBackend(tenantId: string, backend: unknown) {
  try {
    await redis.setex(
      key(tenantId),
      BACKEND_CACHE_TTL,
      JSON.stringify(backend),
    );
  } catch (err) {
    logger.warn({ err, tenantId }, "[storage-backend] cache set failed");
  }
}

export async function invalidateActiveBackend(tenantId: string) {
  try {
    await redis.del(key(tenantId));
  } catch (err) {
    logger.warn({ err, tenantId }, "[storage-backend] cache invalidate failed");
  }
}
