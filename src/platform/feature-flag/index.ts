import { redis } from "@/config/redis.js";
import { env } from "@/config/env.js";

const FLAG_PREFIX = "ff:";

/**
 * 灰度开关：
 * - 全局开关（环境变量）
 * - 租户级开关（Redis）
 * - 用户级开关（Redis）
 */
export class FeatureFlag {
  /**
   * 判断某功能是否对当前上下文开放
   */
  static async isEnabled(
    flag: string,
    ctx: { tenantId?: string; userId?: string },
  ): Promise<boolean> {
    // 1. 全局
    const globalKey = `${FLAG_PREFIX}global:${flag}`;
    const globalVal = await redis.get(globalKey);
    if (globalVal === "1") return true;
    if (globalVal === "0") return false;

    // 2. 租户级
    if (ctx.tenantId) {
      const tenantKey = `${FLAG_PREFIX}tenant:${flag}:${ctx.tenantId}`;
      const tenantVal = await redis.get(tenantKey);
      if (tenantVal === "1") return true;
      if (tenantVal === "0") return false;
    }

    // 3. 用户级
    if (ctx.userId) {
      const userKey = `${FLAG_PREFIX}user:${flag}:${ctx.userId}`;
      const userVal = await redis.get(userKey);
      if (userVal === "1") return true;
      if (userVal === "0") return false;
    }

    // 4. 默认关闭
    return false;
  }

  /**
   * 按百分比灰度（基于 tenantId hash）
   */
  static async isEnabledByPercent(
    flag: string,
    tenantId: string,
    percent: number,
  ): Promise<boolean> {
    const hash = this.hash(tenantId + flag);
    return hash % 100 < percent;
  }

  static async set(
    scope: "global" | "tenant" | "user",
    flag: string,
    value: boolean,
    id?: string,
  ): Promise<void> {
    const key =
      scope === "global"
        ? `${FLAG_PREFIX}global:${flag}`
        : `${FLAG_PREFIX}${scope}:${flag}:${id}`;
    await redis.set(key, value ? "1" : "0");
  }

  private static hash(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }
}
