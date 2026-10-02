/** 业务类型 */
export const MESSAGE_BIZ_TYPE = {
  NOTICE: "notice", // 通知公告
  TODO: "todo", // 待办
  WORKFLOW: "workflow", // 工作流
  SYSTEM: "system", // 系统消息
  ANNOUNCEMENT: "announcement", // 公告
} as const;

export type MessageBizType =
  (typeof MESSAGE_BIZ_TYPE)[keyof typeof MESSAGE_BIZ_TYPE];

export const MESSAGE_BIZ_TYPES = Object.values(MESSAGE_BIZ_TYPE);

/** 优先级 */
export const MESSAGE_PRIORITY = {
  NORMAL: 0,
  IMPORTANT: 1,
  URGENT: 2,
} as const;

/** 未读数缓存 TTL（秒） */
export const UNREAD_CACHE_TTL = 300;

/** 默认消息保留天数（到期后由定时任务清理） */
export const DEFAULT_MESSAGE_TTL_DAYS = 90;

/** 单次批量已读上限 */
export const BATCH_READ_MAX = 100;

/** 单次批量删除上限 */
export const BATCH_DELETE_MAX = 100;
