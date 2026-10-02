import { logger } from "@/platform/logger/index.js";
import { lookup } from "../geoip.js";
import { buildFingerprint } from "../ua-fingerprint.js";
import { LoginSecurityRepository } from "../repository.js";
import { DEFAULT_RULES, LoginRule } from "../rules/index.js";
import type {
  DetectResult,
  LoginContext,
  RuleContext,
  RuleResult,
} from "../types.js";

/**
 * 登录检测引擎
 * - 规则可插拔
 * - 任一规则命中即视为异常
 */
export class LoginDetector {
  private repo = new LoginSecurityRepository();
  private rules: LoginRule[];

  constructor(rules: LoginRule[] = DEFAULT_RULES) {
    this.rules = rules;
  }

  /**
   * 执行检测（供 auth.service 在登录成功后异步调用）
   */
  async detect(ctx: LoginContext): Promise<DetectResult> {
    // 1. 解析 IP 归属地
    const currentGeo = await lookup(ctx.ip);

    // 2. 计算设备指纹
    const currentFingerprint = buildFingerprint(ctx.userAgent);

    // 3. 拉取历史
    const history = await this.repo.findHistory(
      ctx.userId,
      ctx.tenantId,
      ctx.logId,
    );

    // 4. 组装上下文
    const ruleCtx: RuleContext = {
      current: ctx,
      currentGeo,
      currentFingerprint,
      history,
    };

    // 5. 逐条规则执行
    const hits: RuleResult[] = [];
    for (const rule of this.rules) {
      try {
        const r = await rule.evaluate(ruleCtx);
        if (r.hit) hits.push(r);
      } catch (err) {
        logger.warn(
          { err, rule: rule.name, userId: ctx.userId },
          "[login-security] rule failed",
        );
      }
    }

    const isAbnormal = hits.length > 0;
    const primary = hits[0];

    return {
      isAbnormal,
      type: primary?.type,
      reason:
        hits
          .map((h) => h.reason)
          .filter(Boolean)
          .join("；") || undefined,
      geo: currentGeo,
      fingerprint: currentFingerprint,
      hits,
    };
  }

  /**
   * 检测 + 回写结果（组合入口）
   */
  async detectAndPersist(ctx: LoginContext): Promise<DetectResult> {
    const result = await this.detect(ctx);

    if (ctx.logId) {
      await this.repo.updateAbnormalResult(ctx.logId, {
        isAbnormal: result.isAbnormal,
        reason: result.reason,
        type: result.type,
        country: result.geo.country,
        province: result.geo.province,
        city: result.geo.city,
        isp: result.geo.isp,
      });
    }

    return result;
  }
}

export const loginDetector = new LoginDetector();
