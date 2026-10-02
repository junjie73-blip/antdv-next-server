import { redis } from "@/config/redis.js";
import { logger } from "@/platform/logger/index.js";
import { POLICY_CACHE_TTL } from "./constants.js";
import type { ArchivePolicyEntity } from "./types.js";

const ALL_KEY = "archive-policy:all";
const TABLE_PREFIX = "archive-policy:table:";

export async function getCachedAllPolicies(): Promise<
  ArchivePolicyEntity[] | null
> {
  try {
    const v = await redis.get(ALL_KEY);
    return v === null ? null : (JSON.parse(v) as ArchivePolicyEntity[]);
  } catch (err) {
    logger.warn({ err }, "[archive-policy] cache get all failed");
    return null;
  }
}

export async function setCachedAllPolicies(
  policies: ArchivePolicyEntity[],
): Promise<void> {
  try {
    await redis.setex(ALL_KEY, POLICY_CACHE_TTL, JSON.stringify(policies));
  } catch (err) {
    logger.warn({ err }, "[archive-policy] cache set all failed");
  }
}

export async function getCachedPolicyByTable(
  tableName: string,
): Promise<ArchivePolicyEntity | null> {
  try {
    const v = await redis.get(`${TABLE_PREFIX}${tableName}`);
    return v === null ? null : (JSON.parse(v) as ArchivePolicyEntity);
  } catch (err) {
    logger.warn({ err }, "[archive-policy] cache get table failed");
    return null;
  }
}

export async function setCachedPolicyByTable(
  tableName: string,
  policy: ArchivePolicyEntity,
): Promise<void> {
  try {
    await redis.setex(
      `${TABLE_PREFIX}${tableName}`,
      POLICY_CACHE_TTL,
      JSON.stringify(policy),
    );
  } catch (err) {
    logger.warn({ err }, "[archive-policy] cache set table failed");
  }
}

export async function invalidatePolicyCache(): Promise<void> {
  try {
    const keys: string[] = [ALL_KEY];
    // 清理所有 table:* 前缀
    let cursor = "0";
    do {
      const [next, batch] = await redis.scan(
        cursor,
        "MATCH",
        `${TABLE_PREFIX}*`,
        "COUNT",
        100,
      );
      cursor = next;
      keys.push(...batch);
    } while (cursor !== "0");

    if (keys.length > 0) await redis.del(...keys);
  } catch (err) {
    logger.warn({ err }, "[archive-policy] cache invalidate failed");
  }
}
