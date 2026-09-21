import { logger } from "@/platform/logger/index.js";
import { sendAlert } from "@/platform/alert/index.js";
import { auditDroppedTotal } from "@/platform/metrics/index.js";
import { writeAuditBatch, type AuditLogEntry } from "./writer.js";

const queue: AuditLogEntry[] = [];
const MAX_QUEUE = 2000;
const FLUSH_INTERVAL = 3000;
const FLUSH_BATCH = 100;

let timer: NodeJS.Timeout | null = null;
let flushing = false;

export function pushAudit(item: AuditLogEntry): void {
  if (queue.length >= MAX_QUEUE) {
    queue.shift();
    auditDroppedTotal.inc();
  }
  queue.push(item);
  if (!timer) scheduleFlush();
}

function scheduleFlush(): void {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    void flush();
  }, FLUSH_INTERVAL);
}

async function flush(): Promise<void> {
  if (flushing || queue.length === 0) return;
  flushing = true;
  try {
    const MAX_RETRIES = 3;
    while (queue.length > 0) {
      const batch = queue.splice(0, FLUSH_BATCH);
      let retried = 0;
      let success = false;

      while (retried < MAX_RETRIES && !success) {
        try {
          await writeAuditBatch(batch);
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
        auditDroppedTotal.inc(batch.length);

        void sendAlert({
          level: "warning",
          title: "audit_queue_dropped",
          message: `审计日志批次丢失 ${batch.length} 条`,
          source: "audit",
          data: { count: batch.length },
        });

        // 兜底写本地文件
        try {
          const { appendFile } = await import("fs/promises");
          const path = await import("path");
          const fallbackFile = path.join(
            process.cwd(),
            "logs",
            "audit-fallback.log",
          );
          const lines = batch.map((it) => JSON.stringify(it)).join("\n") + "\n";
          await appendFile(fallbackFile, lines, "utf8");
        } catch (writeErr) {
          logger.error({ err: writeErr }, "[audit] fallback write failed");
        }
      }
    }
  } finally {
    flushing = false;
  }
}

export async function drainAuditQueue(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  let guard = 0;
  while (flushing && guard++ < 200) {
    await new Promise((r) => setTimeout(r, 50));
  }
  await flush();
}

export function auditQueueLength(): number {
  return queue.length;
}
