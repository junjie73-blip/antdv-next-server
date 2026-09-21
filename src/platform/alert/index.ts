import { deepRedact } from "@/core/security/redact.js";
import { postWebhook, shouldSend, type AlertPayload } from "./webhook.js";

export type { AlertPayload } from "./webhook.js";

/**
 * 发送告警
 * - 未配置 WEBHOOK_URL 时静默
 * - 同一 level+title 节流
 * - 永不抛异常
 * - ⭐ 不依赖 logger（避免循环）；data 统一走 deepRedact
 */
export async function sendAlert(payload: AlertPayload): Promise<void> {
  const key = `${payload.level}:${payload.title}`;
  if (!shouldSend(key)) return;

  const safeData = payload.data
    ? (deepRedact(payload.data) as Record<string, unknown>)
    : undefined;

  // 保底日志（避免依赖 logger）
  // eslint-disable-next-line no-console
  console.warn(
    JSON.stringify({
      alert: true,
      level: payload.level,
      title: payload.title,
      source: payload.source,
      message: payload.message,
      data: safeData,
    }),
  );

  try {
    await postWebhook({ ...payload, data: safeData });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[alert] send failed:", (err as Error)?.message);
  }
}
