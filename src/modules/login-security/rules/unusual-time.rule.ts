import { LoginRule } from "./base.js";
import { ABNORMAL_TYPE, DETECT_CONFIG } from "../constants.js";
import type { RuleContext, RuleResult } from "../types.js";

/**
 * 规则：异常时段登录
 * 条件：
 *   1. 本次登录的 hour 落在 UNUSUAL_HOURS 内（如 0-6 点）
 *   2. 历史记录数 >= MIN_HISTORY_FOR_TIME
 *   3. 历史中"异常时段"的登录占比 < UNUSUAL_HOUR_RATIO
 */
export class UnusualTimeRule extends LoginRule {
  readonly name = "unusual-time";
  readonly type = ABNORMAL_TYPE.UNUSUAL_TIME;

  async evaluate(ctx: RuleContext): Promise<RuleResult> {
    const { current, history } = ctx;

    const currentHour = current.loginAt.getHours();
    if (
      !(DETECT_CONFIG.UNUSUAL_HOURS as unknown as number[]).includes(
        currentHour,
      )
    ) {
      return { hit: false, type: this.type };
    }

    if (history.length < DETECT_CONFIG.MIN_HISTORY_FOR_TIME) {
      return { hit: false, type: this.type };
    }

    // 历史中处于异常时段的登录数
    const unusualCount = history.filter((h) =>
      (DETECT_CONFIG.UNUSUAL_HOURS as unknown as number[]).includes(
        h.createdAt.getHours(),
      ),
    ).length;

    const ratio = unusualCount / history.length;
    if (ratio >= DETECT_CONFIG.UNUSUAL_HOUR_RATIO) {
      // 用户习惯在此时段登录，不算异常
      return { hit: false, type: this.type };
    }

    return {
      hit: true,
      type: this.type,
      reason: `检测到异常时段登录：${String(currentHour).padStart(2, "0")}:00`,
      metadata: { hour: currentHour, unusualRatio: ratio },
    };
  }
}
