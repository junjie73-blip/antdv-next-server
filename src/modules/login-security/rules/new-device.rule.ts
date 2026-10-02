import { LoginRule } from "./base.js";
import { ABNORMAL_TYPE, DETECT_CONFIG } from "../constants.js";
import { buildFingerprint } from "../ua-fingerprint.js";
import type { RuleContext, RuleResult } from "../types.js";

/**
 * 规则：新设备登录
 * 条件：
 *   1. 历史记录数 >= MIN_HISTORY_FOR_NEW
 *   2. 当前指纹未在历史中出现
 */
export class NewDeviceRule extends LoginRule {
  readonly name = "new-device";
  readonly type = ABNORMAL_TYPE.NEW_DEVICE;

  async evaluate(ctx: RuleContext): Promise<RuleResult> {
    const { current, history, currentFingerprint } = ctx;

    if (history.length < DETECT_CONFIG.MIN_HISTORY_FOR_NEW) {
      return { hit: false, type: this.type };
    }

    // 优先用 deviceId 匹配（如果调用方传了）
    if (current.deviceId) {
      const seenDevice = history.some((h) => h.deviceId === current.deviceId);
      if (seenDevice) return { hit: false, type: this.type };
    }

    // 用 UA 指纹匹配
    const seenFingerprint = history.some(
      (h) => buildFingerprint(h.userAgent) === currentFingerprint,
    );
    if (seenFingerprint) return { hit: false, type: this.type };

    return {
      hit: true,
      type: this.type,
      reason: `检测到新设备登录：${current.userAgent?.slice(0, 120) ?? "未知"}`,
      metadata: { fingerprint: currentFingerprint },
    };
  }
}
