/** 用户组类型 */
export const GROUP_TYPE = {
  CUSTOM: "custom", // 自定义
  DEPARTMENT: "department", // 部门同步（镜像部门）
  PROJECT: "project", // 项目组
} as const;

export type GroupType = (typeof GROUP_TYPE)[keyof typeof GROUP_TYPE];

export const GROUP_TYPES = Object.values(GROUP_TYPE);

/** 单次批量操作上限 */
export const MAX_BATCH_MEMBERS = 500;
export const MAX_BATCH_ROLES = 100;

/** 用户组缓存 TTL（秒） */
export const GROUP_CACHE_TTL = 300;
