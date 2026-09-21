import { createServer, type Server as HttpServer } from "http";
import type { Express } from "express";
import type { WebSocketServer } from "ws";
import { env } from "@/config/env.js";
import { logger } from "@/platform/logger/index.js";
import { initWebSocketServer } from "@/platform/ws/index.js";
import { prisma } from "@/config/database.js";
import { redis, subRedis, blockRedis } from "@/config/redis.js";
import { sendAlert } from "@/platform/alert/index.js";

export interface StartServerResult {
  httpServer: HttpServer;
  wss: WebSocketServer;
}

/**
 * 启动 HTTP 服务
 * - 组装 HTTP server + WebSocket
 * - DB 失败直接退出；Redis 失败降级
 * - ⭐ 同时返回 httpServer 和 wss，供 shutdown 使用
 */
export async function startServer(app: Express): Promise<StartServerResult> {
  const httpServer = createServer(app);

  // 关键依赖校验
  await assertDatabaseOrExit();
  const redisOk = await assertRedisOrWarn();

  // WebSocket（复用同一 HTTP server）
  const wss = initWebSocketServer(httpServer);

  const port = Number(env.PORT || 3000);

  await new Promise<void>((resolve) => {
    httpServer.listen(port, () => {
      logger.info(
        {
          env: env.NODE_ENV,
          port,
          node: process.version,
          pid: process.pid,
          redis: redisOk ? "connected" : "unavailable",
        },
        "🚀 Server listening",
      );
      logger.info(`📚 API Docs: http://localhost:${port}/api/docs`);
      resolve();
    });
  });

  return { httpServer, wss };
}

async function assertDatabaseOrExit(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info("✅ Database connected");
  } catch (err) {
    await sendAlert({
      level: "critical",
      title: "database_connection_failed",
      message: "数据库连接失败，服务无法启动",
      source: "database",
      data: { error: String((err as Error)?.message) },
    });
    process.exit(1);
  }
}

async function assertRedisOrWarn(): Promise<boolean> {
  try {
    await Promise.all([redis.ping(), subRedis.ping(), blockRedis.ping()]);
    logger.info("✅ Redis connected");
    return true;
  } catch (err) {
    await sendAlert({
      level: "warning",
      title: "redis_connection_failed",
      message: "Redis 连接失败，缓存/会话/限流功能降级",
      source: "redis",
      data: { error: String((err as Error)?.message) },
    });
    return false;
  }
}
