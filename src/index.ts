import "reflect-metadata";
import "dotenv/config";
import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import * as bodyParser from "body-parser";
import { createServer } from "http";
import serverless from "serverless-http";

import { prisma } from "@/config/database.js";
import { redis } from "@/config/redis.js";
import { env } from "@/config/env.js";
import { logger } from "@core/logger/index.js";
import { errorHandler, notFoundHandler } from "@middleware/error-handler.js";
import { ddosProtection } from "@middleware/ddos.js";
import { globalRateLimit } from "@middleware/rate-limit.js";
import { swaggerRouter } from "./core/swagger/index.js";
import { ControllerScanner, DecoratorRouter } from "@core/decorator/index.js";
import { controllers } from "./modules/index.js";
import { startNoticeScheduler } from "./modules/notice/scheduler.js";
import { startNoticeSubscriber } from "@/core/redis/pubsub.js";
import { initWebSocketServer } from "@/core/ws/server.js";
import { authMiddleware } from "./middleware/auth.js";
import { auditMiddleware } from "./middleware/audit.js";
import { timingMiddleware } from "./middleware/timing.js";
import { loadJobs } from "./modules/job/scheduler.js";
import { ipRuleMiddleware } from "./middleware/ip-rule.js";
import { startForceLogoutSubscriber } from "@/core/ws/force-logout.js";
import { dataScopeMiddleware } from "./middleware/data-scope.js";
import { tenantResolver } from "./middleware/tenant-resolver.js";
import { drainAuditQueue } from "@/core/audit/queue.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// ==================== CORS ====================
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:9080")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // 无 origin（curl / 同源）直接放行
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);

// ==================== 安全 / 压缩 ====================
app.use(
  helmet({
    contentSecurityPolicy:
      env.NODE_ENV === "development"
        ? false
        : {
            directives: {
              defaultSrc: ["'self'"],
              connectSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'"],
            },
          },
    hsts:
      env.NODE_ENV === "production"
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
  }),
);
app.use(compression());

// ==================== DDoS / 限流 ====================
app.use(ddosProtection);
app.use(globalRateLimit);

// ==================== Body Parser（必须在 audit 之前）====================
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(bodyParser.json({ limit: "10mb" }));

// ==================== 审计（body 解析后）====================
app.use(auditMiddleware);

// ==================== 静态 / 文档 ====================
app.use("/api", swaggerRouter);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ==================== 业务中间件链 ====================
app.use(authMiddleware);
app.use(ipRuleMiddleware);
app.use(timingMiddleware);
app.use(tenantResolver);
app.use(dataScopeMiddleware());

// ==================== 装饰器路由 ====================
const scanner = new ControllerScanner();
scanner.register(...controllers);
app.use("/api/v1", new DecoratorRouter(scanner).build());

// ==================== 健康检查 ====================
app.get("/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch (err) {
    logger.error({ err }, "health check failed");
    res.status(503).json({ status: "degraded" });
  }
});

// ==================== 404 / 错误处理 ====================
app.use(notFoundHandler);
app.use(errorHandler);

// ==================== 启动 ====================
async function bootstrap(): Promise<void> {
  // 1) 连接验证
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info("✅ Database connected");
  } catch (err) {
    logger.error({ err }, "❌ Database connection failed");
    process.exit(1);
  }

  try {
    await redis.ping();
    logger.info("✅ Redis connected");
  } catch (err) {
    logger.warn({ err }, "⚠️ Redis unavailable, some features degraded");
  }

  // 2) 后台任务（仅启动一次）
  try {
    await loadJobs();
    startNoticeScheduler();
    initWebSocketServer(httpServer);
    await startNoticeSubscriber();
    await startForceLogoutSubscriber();
  } catch (err) {
    logger.error({ err }, "background init failed");
  }
}

// ==================== 优雅退出 ====================
let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "shutting down...");

  // 1) 停止接收新请求
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));

  // 2) 冲刷审计队列
  try {
    await drainAuditQueue();
  } catch (err) {
    logger.error({ err }, "drain audit failed");
  }

  // 3) 断开连接
  try {
    await prisma.$disconnect();
  } catch {}
  try {
    await redis.quit();
  } catch {}

  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

// ==================== 启动监听 ====================
const PORT = Number(env.PORT || 3000);

if (env.SERVERLESS === "1") {
  void bootstrap();
  const handler = serverless(app, { requestId: "x-request-id" });
  module.exports = handler;
} else {
  // 传统服务器模式：listen
  bootstrap()
    .then(() => {
      httpServer.listen(PORT, () => {
        logger.info(`🚀 Server running on http://localhost:${PORT}`);
        logger.info(`📚 API Docs: http://localhost:${PORT}/api/docs`);
      });
    })
    .catch((err) => {
      logger.error({ err }, "bootstrap failed");
      process.exit(1);
    });
}

export default app;
