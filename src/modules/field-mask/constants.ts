export const MASK_TYPE = {
  FULL: "full", // 全部替换为 *
  PARTIAL: "partial", // 保留首尾
  HASH: "hash", // 只展示 sha256 前 8 位
  REGEX: "regex", // 自定义正则
  CUSTOM: "custom", // 用固定字符串
} as const;
export type MaskType = (typeof MASK_TYPE)[keyof typeof MASK_TYPE];
export const MASK_TYPES = Object.values(MASK_TYPE);

/** role_scope 保留字 */
export const ROLE_SCOPE = {
  ALL: "all",
} as const;

export const POLICY_CACHE_TTL = 300;
