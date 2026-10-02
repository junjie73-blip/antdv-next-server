export interface WebhookConfig {
  url: string;
  /** 签名密钥（可选，加密存储） */
  secret?: string;
  /** 自定义请求头 */
  headers?: Record<string, string>;
  /** 是否启用幂等 */
  enableIdempotency?: boolean;
  /** 重试次数（默认 3） */
  maxRetries?: number;
}

export interface WebhookPayload {
  event: string; // 事件类型，如 "notice.created"
  data: unknown;
  /** 幂等键，相同 key 服务端应去重 */
  idempotencyKey?: string;
}

export interface WebhookResult {
  success: boolean;
  status?: number;
  latencyMs: number;
  attempts: number;
  error?: string;
}
