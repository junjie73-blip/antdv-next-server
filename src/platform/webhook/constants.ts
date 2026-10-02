export const WEBHOOK_TIMEOUT_MS = 10_000;
export const WEBHOOK_MAX_RETRIES = 3;
export const WEBHOOK_RETRY_BACKOFF = 5_000; // 首次退避（ms），指数增长
export const WEBHOOK_SIGNATURE_HEADER = "X-Signature";
export const WEBHOOK_TIMESTAMP_HEADER = "X-Timestamp";
export const WEBHOOK_IDEMPOTENCY_HEADER = "X-Idempotency-Key";
export const WEBHOOK_EVENT_HEADER = "X-Event-Type";
/** 签名有效窗口（秒） */
export const WEBHOOK_SIGNATURE_WINDOW_S = 300;
