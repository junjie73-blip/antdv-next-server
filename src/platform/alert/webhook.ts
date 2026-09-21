export interface AlertPayload {
  level: "info" | "warning" | "error" | "critical";
  title?: string;
  message: string;
  data?: Record<string, unknown>;
  source?: string;
}

const WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL;
const ALERT_INTERVAL_MS = Number(process.env.ALERT_MIN_INTERVAL_MS || 60_000);

const recentSent = new Map<string, number>();

function shouldSend(key: string): boolean {
  const last = recentSent.get(key);
  if (last && Date.now() - last < ALERT_INTERVAL_MS) return false;
  recentSent.set(key, Date.now());
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, at] of recentSent.entries()) {
    if (now - at > ALERT_INTERVAL_MS * 2) recentSent.delete(key);
  }
}, 5 * 60_000).unref();

export async function postWebhook(payload: AlertPayload): Promise<void> {
  if (!WEBHOOK_URL) return;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
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
    });
  } finally {
    clearTimeout(timer);
  }
}

export { shouldSend, WEBHOOK_URL };
