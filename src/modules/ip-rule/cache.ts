import { prisma } from "@/config/database.js";
import { redis } from "@/config/redis.js";
import { logger } from "@/core/logger/index.js";

const CACHE_KEY_PREFIX = "ip-rule:";
const CACHE_TTL = 300; // 5 分钟兜底过期

export interface IpRuleSet {
  white: string[];
  black: string[];
}

/**
 * 读取某租户的 IP 规则（优先缓存）
 */
export async function getIpRules(tenantId: string): Promise<IpRuleSet> {
  const key = `${CACHE_KEY_PREFIX}${tenantId}`;
  try {
    const cached = await redis.get(key);
    if (cached) {
      return typeof cached === "string"
        ? JSON.parse(cached)
        : (cached as IpRuleSet);
    }
  } catch (e) {
    logger.warn({ e }, "IP rule cache read failed");
  }

  // 缓存未命中，查库
  const rules = await prisma.sys_ip_rule.findMany({
    where: { tenant_id: tenantId, is_deleted: 0, status: "1" },
    select: { rule_type: true, ip_pattern: true },
  });

  const result: IpRuleSet = {
    white: rules
      .filter((r) => r.rule_type === "white")
      .map((r) => r.ip_pattern),
    black: rules
      .filter((r) => r.rule_type === "black")
      .map((r) => r.ip_pattern),
  };

  try {
    await redis.setex(key, CACHE_TTL, JSON.stringify(result));
  } catch (e) {
    logger.warn({ e }, "IP rule cache write failed");
  }

  return result;
}

/**
 * 清除缓存（创建/更新/删除规则后调用）
 */
export async function invalidateIpRuleCache(tenantId: string) {
  try {
    await redis.del(`${CACHE_KEY_PREFIX}${tenantId}`);
  } catch (e) {
    logger.warn({ e }, "IP rule cache invalidate failed");
  }
}
