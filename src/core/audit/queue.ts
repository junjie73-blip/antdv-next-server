import { prisma } from "@/config/database.js";
import { logger } from "@core/logger/index.js";

interface AuditItem {
  tenantId: string;
  userId?: string;
  username?: string;
  operation: string;
  method: string;
  requestUrl: string;
  requestParams?: unknown;
  responseData?: unknown;
  ipAddress: string;
  userAgent?: string;
  executeTime: number;
  status: string;
  errorMsg?: string;
}

const queue: AuditItem[] = [];
const MAX_QUEUE = 2000;
const FLUSH_INTERVAL = 3000; // 3s
const FLUSH_BATCH = 100;

let timer: NodeJS.Timeout | null = null;
let flushing = false;

/** 敏感字段黑名单 */
const SENSITIVE_KEYS = [
  "password",
  "oldPassword",
  "newPassword",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
  "authorization",
];

/** 递归脱敏 */
function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[deep]";
  if (value == null) return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.includes(k)) out[k] = "***";
      else out[k] = redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

function stringifySafe(v: unknown, max = 4000): string | null {
  if (v == null) return null;
  try {
    const s = JSON.stringify(redact(v));
    return s.length > max ? `${s.slice(0, max)}...[truncated]` : s;
  } catch {
    return null;
  }
}

export function pushAudit(item: AuditItem): void {
  if (queue.length >= MAX_QUEUE) {
    // 队列满：丢弃最旧的，保留最新的
    queue.shift();
  }
  queue.push(item);
  if (!timer) scheduleFlush();
}

function scheduleFlush() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    void flush();
  }, FLUSH_INTERVAL);
}

async function flush(): Promise<void> {
  if (flushing || queue.length === 0) return;
  flushing = true;
  const MAX_RETRIES = 3;
  while (queue.length > 0) {
    const batch = queue.splice(0, FLUSH_BATCH);
    let retried = 0;
    let success = false;

    while (retried < MAX_RETRIES && !success) {
      try {
        await prisma.sys_audit_log.createMany({
          data: batch.map((it) => ({
            tenant_id: it.tenantId,
            user_id: it.userId ?? null,
            username: it.username ?? null,
            operation: it.operation,
            method: it.method,
            request_url: it.requestUrl,
            request_params: stringifySafe(it.requestParams),
            response_data: stringifySafe(it.responseData),
            ip_address: it.ipAddress,
            user_agent: it.userAgent ?? null,
            execute_time: it.executeTime,
            status: it.status,
            error_msg: it.errorMsg ?? null,
          })),
        });
        success = true;
      } catch (err) {
        retried++;
        logger.error({ err, retried }, "[audit] flush failed");
        if (retried < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 500 * retried));
        }
      }
    }

    if (!success) {
      logger.error(
        { size: batch.length },
        "[audit] batch dropped after retries",
      );
    }
  }
}

/** 进程退出前调用，尽量落库 */
export async function drainAuditQueue(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }

  // 等待正在进行的 flush 完成
  while (flushing) {
    await new Promise((r) => setTimeout(r, 50));
  }

  // 触发新的 flush
  await flush();
}
