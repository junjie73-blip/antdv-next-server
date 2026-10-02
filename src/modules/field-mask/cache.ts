import { redis } from "@/config/redis.js";
import { logger } from "@/platform/logger/index.js";
import { POLICY_CACHE_TTL } from "./constants.js";
import type { PolicyMap } from "./types.js";

const PREFIX = "field-mask:";

function key(tenantId: string): string {
  return `${PREFIX}${tenantId}`;
}

export async function getPolicyMap(
  tenantId: string,
): Promise<PolicyMap | null> {
  try {
    const raw = await redis.get(key(tenantId));
    return raw ? (JSON.parse(raw) as PolicyMap) : null;
  } catch (err) {
    logger.warn({ err, tenantId }, "[field-mask] cache get failed");
    return null;
  }
}

export async function setPolicyMap(tenantId: string, map: PolicyMap) {
  try {
    await redis.setex(key(tenantId), POLICY_CACHE_TTL, JSON.stringify(map));
  } catch (err) {
    logger.warn({ err, tenantId }, "[field-mask] cache set failed");
  }
}

export async function invalidatePolicyMap(tenantId: string) {
  try {
    await redis.del(key(tenantId));
  } catch (err) {
    logger.warn({ err, tenantId }, "[field-mask] cache invalidate failed");
  }
}
