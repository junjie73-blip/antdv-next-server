import type { AbnormalType } from "../constants.js";
import type { RuleContext, RuleResult } from "../types.js";

export abstract class LoginRule {
  /** 规则唯一标识 */
  abstract readonly name: string;
  /** 异常类型 */
  abstract readonly type: AbnormalType;

  /**
   * 执行检测
   * @returns hit=true 表示命中异常
   */
  abstract evaluate(ctx: RuleContext): Promise<RuleResult>;
}
