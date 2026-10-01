export interface ExportRetryConfig {
  /** 最大重试次数 */
  maxRetries: number;
  /** 初始延迟（毫秒） */
  initialDelayMs: number;
  /** 退避倍数 */
  backoffMultiplier: number;
  /** 最大延迟（毫秒） */
  maxDelayMs: number;
  /** 抖动范围（0-1） */
  jitterRatio: number;
}

/** 默认配置 */
export const DEFAULT_EXPORT_RETRY: ExportRetryConfig = {
  maxRetries: 3,
  initialDelayMs: 5_000,
  backoffMultiplier: 2,
  maxDelayMs: 5 * 60 * 1000, // 5 分钟
  jitterRatio: 0.1,
};

/**
 * 计算第 N 次重试的延迟（指数退避 + 抖动）
 */
export function calcRetryDelay(
  attempt: number,
  config: ExportRetryConfig = DEFAULT_EXPORT_RETRY,
): number {
  const base =
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  const capped = Math.min(base, config.maxDelayMs);
  const jitter = capped * config.jitterRatio * (Math.random() * 2 - 1);
  return Math.max(0, Math.floor(capped + jitter));
}
