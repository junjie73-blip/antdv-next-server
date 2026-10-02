/** 队列显示名 */
export const QUEUE_DISPLAY_NAME: Record<string, string> = {
  "report-export": "报表导出",
  "upload-merge": "分片合并",
  "wf-notify": "工作流通知",
  "cache-warm": "缓存预热",
  export: "导出",
  "report-archive": "报表归档",
};

/** 支持的状态 */
export const JOB_STATUS_LIST = [
  "waiting",
  "active",
  "completed",
  "failed",
  "delayed",
  "paused",
] as const;

export type JobStatus = (typeof JOB_STATUS_LIST)[number];

export const VALID_JOB_STATUS = new Set<string>(JOB_STATUS_LIST);

/** clean 允许清理的状态 */
export const CLEANABLE_STATUS = new Set([
  "completed",
  "failed",
  "delayed",
  "wait",
]);
export type CleanableStatus = "completed" | "failed" | "delayed" | "wait";

/** 单次 clean 最大清理条数 */
export const MAX_CLEAN_LIMIT = 5000;
