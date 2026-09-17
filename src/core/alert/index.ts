import { logger } from "@/core/logger/index.js";

const WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL;
const ALERT_INTERVAL_MS = Number(process.env.ALERT_MIN_INTERVAL_MS || 60_000);

export type AlertLevel = "info" | "warning" | "error" | "critical";

export interface AlertPayload {
  level: AlertLevel;
  /** 告警标题（分组用） */
  title?: string;
  /** 详细消息 */
  message: string;
  /** 结构化数据 */
  data?: Record<string, unknown>;
  /** 触发来源模块，如 "database" / "job" / "ws" */
  source?: string;
}

/** 最近一次发送时间（防刷屏） */
const recentSent = new Map<string, number>();

function shouldSend(key: string): boolean {
  const last = recentSent.get(key);
  if (last && Date.now() - last < ALERT_INTERVAL_MS) return false;
  recentSent.set(key, Date.now());
  return true;
}

/** 定期清理 recentSent，避免内存泄漏 */
setInterval(() => {
  const now = Date.now();
  for (const [key, at] of recentSent.entries()) {
    if (now - at > ALERT_INTERVAL_MS * 2) recentSent.delete(key);
  }
}, 5 * 60_000).unref();

/**
 * 发送告警
 * - 未配置 WEBHOOK_URL 时静默跳过（只打日志）
 * - 同一 title 在 ALERT_INTERVAL_MS 内只发一次
 * - 永不抛异常
 */
export async function sendAlert(payload: AlertPayload): Promise<void> {
  const key = `${payload.level}:${payload.title}`;

  if (!shouldSend(key)) return;

  // 至少记一条 warn 日志（就算没配 webhook 也留痕）
  logger.warn(
    {
      alert: true,
      level: payload.level,
      title: payload.title,
      source: payload.source,
      ...payload.data,
    },
    `[alert] ${payload.message}`,
  );

  if (!WEBHOOK_URL) return;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        service: "antdv-server",
        host: process.env.HOSTNAME || process.env.COMPUTERNAME || "unknown",
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
  } catch (err) {
    logger.error({ err, title: payload.title }, "[alert] send failed");
  }
}
