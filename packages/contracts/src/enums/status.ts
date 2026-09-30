/** 通用启用/禁用状态 */
export const STATUS = {
  DISABLED: "0",
  ENABLED: "1",
} as const;

export type Status = (typeof STATUS)[keyof typeof STATUS];

/** 布尔→状态 */
export function boolToStatus(v: boolean): Status {
  return v ? STATUS.ENABLED : STATUS.DISABLED;
}

/** 状态→布尔 */
export function statusToBool(s: string): boolean {
  return s === STATUS.ENABLED;
}
