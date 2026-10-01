import { startTracing } from "./platform/observability/tracing/tracing.js";
import {
  createApp,
  startServer,
  startSubscribers,
  installShutdownHandlers,
} from "@/bootstrap/index.js";
import { startScheduler } from "@/jobs/index.js";
import { logger } from "@/platform/logger/index.js";
import { sendAlert } from "@/platform/alert/index.js";

import { blockRedis, redis, subRedis } from "@/config/redis.js";
import {
  snapshotTimers,
  trackTimers,
  watchListenerLeak,
} from "./core/diagnostics/index.js";
import { env } from "./config/env.js";

async function main(): Promise<void> {
  startTracing({
    enabled: env.OTEL_ENABLED,
    serviceName: env.OTEL_SERVICE_NAME || "antdv",
    serviceVersion: env.APP_VERSION,
    environment: env.NODE_ENV,
    exporterUrl: env.OTEL_EXPORTER_URL,
  });
  // 1) 诊断探针
  watchListenerLeak(process, "process", 50);
  watchListenerLeak(redis, "redis", 20);
  watchListenerLeak(subRedis, "subRedis", 20);
  watchListenerLeak(blockRedis, "blockRedis", 20);

  trackTimers();

  // 2) 组装 + 启动
  const app = createApp();
  const { httpServer, wss } = await startServer(app);

  // 3) 后台订阅 + cron
  await startSubscribers();
  startScheduler();

  // 4) 优雅退出
  installShutdownHandlers({ httpServer, wss });

  // 5) 泄漏快照（每 5 分钟）
  const snapshotTimer = setInterval(() => {
    logger.info(
      {
        listeners: process.listenerCount("SIGTERM"),
        timers: snapshotTimers().count,
        heapUsed: process.memoryUsage().heapUsed,
        handles: (process as any)._getActiveHandles?.().length,
      },
      "leak-snapshot",
    );
  }, 5 * 60_000);
  snapshotTimer.unref();
}

main().catch(async (err) => {
  logger.error({ err }, "bootstrap failed");
  await sendAlert({
    level: "critical",
    title: "bootstrap_failed",
    message: `服务启动失败：${(err as Error)?.message}`,
    source: "process",
  });
  process.exit(1);
});
