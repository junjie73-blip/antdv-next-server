import { logger } from "@/platform/logger/index.js";
import { sendOnce } from "./client.js";
import { WEBHOOK_MAX_RETRIES, WEBHOOK_RETRY_BACKOFF } from "./constants.js";
import type { WebhookConfig, WebhookPayload, WebhookResult } from "./types.js";

/**
 * 带指数退避的重试发送
 * - 5xx / 网络错误 → 重试
 * - 4xx → 不重试（客户端错误）
 */
export async function sendWithRetry(
  config: WebhookConfig,
  payload: WebhookPayload,
): Promise<WebhookResult> {
  const maxRetries = config.maxRetries ?? WEBHOOK_MAX_RETRIES;
  let lastResult: WebhookResult | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await sendOnce(config, payload);
    result.attempts = attempt + 1;
    lastResult = result;

    if (result.success) return result;

    // 4xx 不重试
    if (result.status && result.status >= 400 && result.status < 500) {
      return result;
    }

    if (attempt < maxRetries) {
      const delay = WEBHOOK_RETRY_BACKOFF * Math.pow(2, attempt);
      logger.debug(
        { url: config.url, attempt: attempt + 1, delay },
        "[webhook] retrying",
      );
      await sleep(delay);
    }
  }

  return lastResult!;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
