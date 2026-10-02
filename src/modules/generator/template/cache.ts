import { redis } from "@/config/redis.js";
import { logger } from "@/platform/logger/index.js";
import { TEMPLATE_CACHE_TTL } from "./constants.js";

const PREFIX = "gen-template:";

type LoadedTemplate = {
  templateKey: string;
  category: string;
  version: number;
  content: string;
};

export async function getTemplateCache(
  tenantId: string,
): Promise<LoadedTemplate[] | null> {
  try {
    const raw = await redis.get(`${PREFIX}${tenantId}`);
    return raw ? (JSON.parse(raw) as LoadedTemplate[]) : null;
  } catch (err) {
    logger.warn({ err, tenantId }, "[gen-template] cache get failed");
    return null;
  }
}

export async function setTemplateCache(
  tenantId: string,
  list: LoadedTemplate[],
) {
  try {
    await redis.setex(
      `${PREFIX}${tenantId}`,
      TEMPLATE_CACHE_TTL,
      JSON.stringify(list),
    );
  } catch (err) {
    logger.warn({ err, tenantId }, "[gen-template] cache set failed");
  }
}

export async function invalidateTemplateCache(tenantId: string) {
  try {
    await redis.del(`${PREFIX}${tenantId}`);
  } catch (err) {
    logger.warn({ err, tenantId }, "[gen-template] cache invalidate failed");
  }
}
