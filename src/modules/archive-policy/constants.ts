export const TABLE_TYPE = {
  PARTITIONED: "partitioned",
  PLAIN: "plain",
} as const;

export type TableType = (typeof TABLE_TYPE)[keyof typeof TABLE_TYPE];

export const ARCHIVE_MODE = {
  PARTITION_DROP: "partition_drop", // 分区表：drop partition
  TIME_RANGE_DELETE: "time_range_delete", // 普通表：delete where time < cutoff
} as const;

export const ARCHIVE_STATUS = {
  SUCCESS: "success",
  FAILED: "failed",
  SKIPPED: "skipped",
} as const;

/** 策略缓存 TTL（秒） */
export const POLICY_CACHE_TTL = 300;

/** 白名单表（防 SQL 注入） */
export const ALLOWED_TABLES = new Set([
  "sys_audit_log",
  "sys_login_log",
  "sys_notice_send_log",
  "sys_job_log",
  "sys_message",
  "sys_audit_daily",
  "sys_login_daily",
  "sys_cache_operation_log",
  "sys_slow_query_log",
]);

/** 归档后是否物理删除源数据 */
export const DROP_AFTER_ARCHIVE = true;

/** 单次归档最大批数 */
export const MAX_ARCHIVE_BATCHES = 100;
