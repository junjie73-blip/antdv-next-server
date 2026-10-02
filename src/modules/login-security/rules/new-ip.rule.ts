import { LoginRule } from "./base.js";
import { ABNORMAL_TYPE, DETECT_CONFIG } from "../constants.js";
import type { RuleContext, RuleResult } from "../types.js";

/**
 * 规则：新 IP 登录
 * 条件：
 *   1. 历史记录数 >= MIN_HISTORY_FOR_NEW
 *   2. 当前 IP 未在历史中出现
 */
export class NewIpRule extends LoginRule {
  readonly name = "new-ip";
  readonly type = ABNORMAL_TYPE.NEW_IP;

  async evaluate(ctx: RuleContext): Promise<RuleResult> {
    const { current, history } = ctx;

    // 历史不足，不判定（避免新用户首次登录就告警）
    if (history.length < DETECT_CONFIG.MIN_HISTORY_FOR_NEW) {
      return { hit: false, type: this.type };
    }

    // 当前 IP 是否出现在历史里
    const seen = history.some((h) => h.ip === current.ip);
    if (seen) return { hit: false, type: this.type };

    return {
      hit: true,
      type: this.type,
      reason: `检测到新 IP 登录：${current.ip}`,
      metadata: { ip: current.ip, geo: ctx.currentGeo },
    };
  }
}
