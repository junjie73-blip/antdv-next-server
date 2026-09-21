import type { Server as HttpServer } from "http";
import type { WebSocketServer } from "ws";
import { logger } from "@/platform/logger/index.js";
import { wsManager } from "@/platform/ws/index.js";
import { drainAuditQueue } from "@/platform/audit/index.js";
import { prisma } from "@/config/database.js";
import { redis, subRedis, blockRedis } from "@/config/redis.js";

interface ShutdownDeps {
  httpServer: HttpServer;
  wss: WebSocketServer;
}

let shuttingDown = false;

/**
 * 优雅退出
 *  1. 通知 WS 客户端即将重启
 *  2. 停止接收新请求（httpServer.close）
 *  3. 关闭 WebSocket
 *  4. 冲刷审计队列
 *  5. 断开 DB / Redis
 *
 * 幂等：重复调用只执行一次。
 * 兜底：15s 未完成强制退出。
 */
export async function shutdown(
  signal: string,
  deps: ShutdownDeps,
): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info({ signal }, "🛑 shutting down...");

  const forceExit = setTimeout(() => {
    logger.error("shutdown timeout, force exit");
    process.exit(1);
  }, 15_000);
  forceExit.unref();

  try {
    // 1) 通知客户端
    wsManager.sendToType("notice", {
      type: "server-shutdown",
      data: { message: "服务即将重启，请稍后重连" },
      timestamp: Date.now(),
    });
    await new Promise((r) => setTimeout(r, 1000));

    // 2) 关闭 WebSocket
    try {
      wsManager.closeAll("server shutdown");
      deps.wss.close();
    } catch (err) {
      logger.warn({ err }, "close ws failed");
    }

    // 3) 停止接收新请求
    await new Promise<void>((resolve) => {
      deps.httpServer.close(() => resolve());
      // 主动关闭 keep-alive 连接
      (deps.httpServer as any).closeAllConnections?.();
    });

    // 4) 冲刷审计队列
    try {
      await drainAuditQueue();
    } catch (err) {
      logger.error({ err }, "drain audit failed");
    }

    // 5) 断开连接
    await Promise.allSettled([
      prisma.$disconnect(),
      redis.quit(),
      subRedis.quit(),
      blockRedis.quit(),
    ]);

    clearTimeout(forceExit);
    logger.info("✅ shutdown complete");
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "shutdown error");
    process.exit(1);
  }
}

export function installShutdownHandlers(deps: ShutdownDeps): void {
  process.on("SIGTERM", () => void shutdown("SIGTERM", deps));
  process.on("SIGINT", () => void shutdown("SIGINT", deps));

  process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "uncaughtException");
    void import("@/platform/alert/index.js").then(({ sendAlert }) =>
      sendAlert({
        level: "critical",
        title: "uncaught_exception",
        message: `未捕获异常：${err.message}`,
        source: "process",
        data: { stack: err.stack?.slice(0, 1000) },
      }),
    );
    setTimeout(() => process.exit(1), 2000);
  });

  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "unhandledRejection");
    void import("@/platform/alert/index.js").then(({ sendAlert }) =>
      sendAlert({
        level: "error",
        title: "unhandled_rejection",
        message: `未处理的 Promise 拒绝：${String(reason).slice(0, 200)}`,
        source: "process",
      }),
    );
  });
}
