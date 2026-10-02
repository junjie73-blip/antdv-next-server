/** 异常类型 */
export const ABNORMAL_TYPE = {
  NEW_IP: "new_ip",
  NEW_DEVICE: "new_device",
  IMPOSSIBLE_TRAVEL: "impossible_travel",
  UNUSUAL_TIME: "unusual_time",
} as const;

export type AbnormalType = (typeof ABNORMAL_TYPE)[keyof typeof ABNORMAL_TYPE];

/** 通知状态 */
export const NOTIFY_STATUS = {
  PENDING: 0,
  SENT: 1,
  FAILED: 2,
} as const;

/** 检测参数（可被租户配置覆盖，暂用常量） */
export const DETECT_CONFIG = {
  /** 历史窗口（天） */
  HISTORY_DAYS: 30,
  /** 历史最大拉取条数 */
  HISTORY_MAX_ROWS: 200,
  /** 触发"新 IP/新设备"检测的最小历史记录数 */
  MIN_HISTORY_FOR_NEW: 3,
  /** 触发"不可能旅行"检测的最小间隔（分钟） */
  TRAVEL_MIN_GAP_MINUTES: 5,
  /** 不可能旅行的速度阈值（km/h） */
  TRAVEL_MAX_SPEED_KMH: 900, // 飞机速度上界
  /** 触发"异常时段"检测所需的历史记录数 */
  MIN_HISTORY_FOR_TIME: 10,
  /** 异常时段的定义（0-6 点） */
  UNUSUAL_HOURS: [0, 1, 2, 3, 4, 5],
  /** 异常时段命中比例阈值（历史中处于该时段的记录占比 < 此值才算异常） */
  UNUSUAL_HOUR_RATIO: 0.05,
} as const;

/** GeoIP 缓存 TTL（秒） */
export const GEOIP_CACHE_TTL = 86400;

/** 检测并发上限 */
export const DETECT_CONCURRENCY = 10;
