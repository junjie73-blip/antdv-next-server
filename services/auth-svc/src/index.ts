import { config } from "dotenv";
config();

import { logger } from "./config/logger.js";
import { startTracing, stopTracing } from "./observability/tracing.js";
import { startServers } from "./config/server.js";
import { deregisterFromConsul } from "./registry/consul.js";
import { prisma } from "./config/database.js";
import { closeRedis } from "./config/redis.js";

async function main(): Promise<void> {
  startTracing();

  const { httpServer, grpcServer } = await startServers();

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "🛑 shutting down...");

    const forceExit = setTimeout(() => process.exit(1), 15_000);
    forceExit.unref();

    try {
      // 1) 先摘除流量（Consul 注销，确保不再有新连接进来）
      await deregisterFromConsul();

      // 2) 停止接收新请求
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));

      // 3) gRPC 优雅关闭（等待在途请求完成）
      await new Promise<void>((resolve) =>
        grpcServer.tryShutdown(() => resolve()),
      );

      // 4) 释放资源
      await Promise.allSettled([prisma.$disconnect(), closeRedis()]);
      await stopTracing();

      clearTimeout(forceExit);
      logger.info("✅ shutdown complete");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "shutdown error");
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "uncaughtException");
    void shutdown("uncaughtException");
  });
  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "unhandledRejection");
  });
}

main().catch((err) => {
  console.error("[auth-svc] bootstrap failed:", err);
  process.exit(1);
});
