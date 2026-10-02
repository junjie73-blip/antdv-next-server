import { NewIpRule } from "./new-ip.rule.js";
import { NewDeviceRule } from "./new-device.rule.js";
import { ImpossibleTravelRule } from "./impossible-travel.rule.js";
import { UnusualTimeRule } from "./unusual-time.rule.js";
import type { LoginRule } from "./base.js";

export const DEFAULT_RULES: LoginRule[] = [
  new NewIpRule(),
  new NewDeviceRule(),
  new ImpossibleTravelRule(),
  new UnusualTimeRule(),
];

export { LoginRule } from "./base.js";
export { NewIpRule } from "./new-ip.rule.js";
export { NewDeviceRule } from "./new-device.rule.js";
export { ImpossibleTravelRule } from "./impossible-travel.rule.js";
export { UnusualTimeRule } from "./unusual-time.rule.js";
