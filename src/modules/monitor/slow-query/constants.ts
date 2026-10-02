/** 慢查询阈值（ms），低于此值不采集 */
export const SLOW_QUERY_MS = 500;

/** 缓冲条数达到即 flush */
export const FLUSH_SIZE = 500;

/** 缓冲最长驻留时间（ms） */
export const FLUSH_INTERVAL_MS = 3000;

/** fingerprint 长度 */
export const FINGERPRINT_LEN = 32;

/** query_sample 单条最大长度 */
export const MAX_SAMPLE_LEN = 2000;

/** 慢查询记录保留天数（默认），可被 sys_archive_policy 覆盖 */
export const DEFAULT_RETENTION_DAYS = 30;

/** status 枚举 */
export const SLOW_QUERY_STATUS = {
  OPEN: "open",
  RESOLVED: "resolved",
  IGNORED: "ignored",
} as const;

export type SlowQueryStatus =
  (typeof SLOW_QUERY_STATUS)[keyof typeof SLOW_QUERY_STATUS];

/** 单页最大条数 */
export const MAX_PAGE_SIZE = 100;

/** 告警：mean_time 阈值（ms） */
export const ALERT_MEAN_MS = 2000;

/** 告警：24h 内 calls 增长阈值 */
export const ALERT_CALLS_GROWTH = 1000;

/** 日志表 SQL 前缀，用于跳过自采集 */
export const SKIP_SQL_PATTERNS: RegExp[] = [
  /^\s*(?:--[^\n]*\n|\s)*insert\s+into\s+"?sys_slow_query_log"?/i,
  /^\s*(?:--[^\n]*\n|\s)*insert\s+into\s+"?sys_audit_log"?/i,
  /^\s*(?:--[^\n]*\n|\s)*insert\s+into\s+"?sys_login_log"?/i,
  /^\s*(?:--[^\n]*\n|\s)*insert\s+into\s+"?sys_job_log"?/i,
];
