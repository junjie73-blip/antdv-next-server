import { logger } from "@/platform/logger/index.js";
import { httpAgent, httpsAgent } from "@/shared/http/agent.js";
import { sign } from "./signer.js";
import {
  WEBHOOK_TIMEOUT_MS,
  WEBHOOK_SIGNATURE_HEADER,
  WEBHOOK_TIMESTAMP_HEADER,
  WEBHOOK_IDEMPOTENCY_HEADER,
  WEBHOOK_EVENT_HEADER,
} from "./constants.js";
import type { WebhookConfig, WebhookPayload, WebhookResult } from "./types.js";

/**
 * 单次发送（不重试）
 */
export async function sendOnce(
  config: WebhookConfig,
  payload: WebhookPayload,
): Promise<WebhookResult> {
  const t0 = Date.now();
  const body = JSON.stringify(payload.data ?? {});
  const timestamp = Math.floor(Date.now() / 1000);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    [WEBHOOK_TIMESTAMP_HEADER]: String(timestamp),
    [WEBHOOK_EVENT_HEADER]: payload.event,
    ...(config.headers ?? {}),
  };

  if (config.secret) {
    headers[WEBHOOK_SIGNATURE_HEADER] = sign(body, config.secret, timestamp);
  }
  if (config.enableIdempotency && payload.idempotencyKey) {
    headers[WEBHOOK_IDEMPOTENCY_HEADER] = payload.idempotencyKey;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const res = await fetch(config.url, {
      method: "POST",
      headers,
      body,
      signal: ctrl.signal,
      // Node 18+ 使用 undici；如需连接池可换 axios + httpAgent
    });

    return {
      success: res.ok,
      status: res.status,
      latencyMs: Date.now() - t0,
      attempts: 1,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - t0,
      attempts: 1,
      error: String(err?.message ?? err),
    };
  } finally {
    clearTimeout(timer);
  }
}
