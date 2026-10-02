import { createHash } from "node:crypto";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { redis } from "@/config/redis.js";
import { FeatureFlagRepository } from "./repository.js";

const CACHE_PREFIX = "flag:";
const CACHE_TTL_SEC = 60;

export interface EvalContext {
  userId?: string;
  tenantId?: string;
  roles?: string[];
}

export interface EvalResult {
  enabled: boolean;
  reason: string;
  flagKey: string;
  matchedRuleId?: string;
}

export class FeatureFlagService {
  async listExpiring(days = 7) {
    return this.repo.findExpiring(days);
  }
  private repo = new FeatureFlagRepository();

  /* ========== 对外核心 API ========== */

  /**
   * 判断某个特性是否开启。
   * 优先级：flag.status > user > role > tenant > percentage > default_on
   */
  async isEnabled(flagKey: string, ctx: EvalContext): Promise<boolean> {
    const result = await this.evaluate(flagKey, ctx);
    return result.enabled;
  }

  /** 带原因的完整评估（用于调试 / 前端展示） */
  async evaluate(flagKey: string, ctx: EvalContext): Promise<EvalResult> {
    const cacheKey = this.buildCacheKey(flagKey, ctx);
    const cached = await this.cacheGet(cacheKey);
    if (cached !== null) return { ...cached, flagKey };

    const flag = await this.repo.findByKey(flagKey);
    const result = this.doEvaluate(flag, ctx, flagKey);
    await this.cacheSet(cacheKey, result);
    return result;
  }

  /** 批量评估（前端首屏可一次性拉取） */
  async evaluateBatch(
    flagKeys: string[],
    ctx: EvalContext,
  ): Promise<Record<string, boolean>> {
    const out: Record<string, boolean> = {};
    for (const key of flagKeys) {
      out[key] = await this.isEnabled(key, ctx);
    }
    return out;
  }

  /* ========== 评估逻辑 ========== */

  private doEvaluate(flag: any, ctx: EvalContext, flagKey: string): EvalResult {
    if (!flag) {
      return { enabled: false, reason: "flag_not_found", flagKey };
    }
    if (flag.status !== "1") {
      return { enabled: false, reason: "flag_disabled", flagKey };
    }
    if (flag.expire_at && flag.expire_at.getTime() < Date.now()) {
      return { enabled: false, reason: "flag_expired", flagKey };
    }

    const now = Date.now();

    // 过滤生效中的规则
    const activeRules = (flag.rules ?? []).filter((r: any) => {
      if (r.is_deleted) return false;
      if (r.effective_from && r.effective_from.getTime() > now) return false;
      if (r.effective_until && r.effective_until.getTime() < now) return false;
      if (r.expire_at && r.expire_at.getTime() < now) return false;
      return true;
    });

    // 1) user 规则（最高优先级）
    const userRule = activeRules.find(
      (r: any) => r.rule_type === "user" && r.target === ctx.userId,
    );
    if (userRule) {
      return {
        enabled: userRule.enabled === 1,
        reason: "user_rule",
        flagKey,
        matchedRuleId: userRule.rule_id,
      };
    }

    // 2) role 规则
    if (ctx.roles?.length) {
      const roleRule = activeRules.find(
        (r: any) => r.rule_type === "role" && ctx.roles!.includes(r.target),
      );
      if (roleRule) {
        return {
          enabled: roleRule.enabled === 1,
          reason: "role_rule",
          flagKey,
          matchedRuleId: roleRule.rule_id,
        };
      }
    }

    // 3) tenant 规则
    const tenantRule = activeRules.find(
      (r: any) => r.rule_type === "tenant" && r.target === ctx.tenantId,
    );
    if (tenantRule) {
      return {
        enabled: tenantRule.enabled === 1,
        reason: "tenant_rule",
        flagKey,
        matchedRuleId: tenantRule.rule_id,
      };
    }

    // 4) 百分比灰度（用 userId 稳定哈希）
    if (flag.rollout_pct > 0 && ctx.userId) {
      const bucket = stableBucket(ctx.userId, flagKey);
      const hit = bucket < flag.rollout_pct;
      if (hit) {
        return { enabled: true, reason: "rollout_pct", flagKey };
      }
    }

    // 5) 默认值
    return {
      enabled: flag.default_on === 1,
      reason: "default",
      flagKey,
    };
  }

  /* ========== CRUD ========== */

  async list(params: Parameters<FeatureFlagRepository["findPage"]>[0]) {
    return this.repo.findPage(params);
  }

  async detail(flagId: string) {
    return this.repo.findByKey(flagId).then((f) => {
      if (!f) throw new AppError("特性开关不存在", 404001, 404);
      return f;
    });
  }

  async create(dto: any, userId?: string) {
    const existing = await this.repo.findByKey(dto.flagKey);
    if (existing)
      throw new AppError(`Flag key '${dto.flagKey}' 已存在`, 409001, 409);
    const created = await this.repo.create({ ...dto, userId });
    await this.invalidateAllCache();
    return created;
  }

  async update(flagId: string, patch: any, userId?: string) {
    const updated = await this.repo.update(flagId, {
      ...patch,
      updated_by: userId,
    });
    await this.invalidateAllCache();
    return updated;
  }

  async remove(flagId: string, userId: string) {
    await this.repo.softDelete(flagId, userId);
    await this.invalidateAllCache();
  }

  async replaceRules(flagId: string, rules: any[], userId?: string) {
    const result = await this.repo.replaceRules(flagId, rules, userId);
    await this.invalidateAllCache();
    return result;
  }

  /* ========== 缓存 ========== */

  private buildCacheKey(flagKey: string, ctx: EvalContext): string {
    const parts = [
      flagKey,
      ctx.userId ?? "-",
      ctx.tenantId ?? "-",
      (ctx.roles ?? []).sort().join(","),
    ];
    return `${CACHE_PREFIX}${parts.join("|")}`;
  }

  private async cacheGet(
    key: string,
  ): Promise<Omit<EvalResult, "flagKey"> | null> {
    try {
      const raw = await redis.get(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private async cacheSet(key: string, result: EvalResult): Promise<void> {
    try {
      const { flagKey: _, ...payload } = result;
      await redis.setex(key, CACHE_TTL_SEC, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }

  /** 全量失效（简单方案：SCAN 前缀删） */
  async invalidateAllCache(): Promise<void> {
    try {
      const keys: string[] = [];
      let cursor = "0";
      do {
        const [next, batch] = await redis.scan(
          cursor,
          "MATCH",
          `${CACHE_PREFIX}*`,
          "COUNT",
          200,
        );
        cursor = next;
        keys.push(...batch);
      } while (cursor !== "0");
      if (keys.length > 0) {
        const CHUNK = 500;
        for (let i = 0; i < keys.length; i += CHUNK) {
          await redis.del(...keys.slice(i, i + CHUNK));
        }
      }
      logger.debug({ count: keys.length }, "[feature-flag] cache invalidated");
    } catch (err) {
      logger.warn({ err }, "[feature-flag] invalidate cache failed");
    }
  }
}

/* ========== 稳定哈希 ========== */

function stableBucket(userId: string, flagKey: string): number {
  const hash = createHash("md5").update(`${flagKey}:${userId}`).digest();
  return hash.readUInt16BE(0) % 100;
}
