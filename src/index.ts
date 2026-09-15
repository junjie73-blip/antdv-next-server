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
import { metricsMiddleware, metricsRouter } from "@/core/metrics/index.js";
import { traceMiddleware } from "./middleware/trace.js";
import { wsManager } from "./core/ws/manager.js";
import { getClientIp } from "./common/utils/ip.js";
import { sendAlert } from "./core/alert/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// ==================== CORS ====================
const allowedOrigins = env.FRONTEND_URL.split(",")
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
app.use(bodyParser.urlencoded({ extended: true, limit: env.BODY_LIMIT }));
app.use(bodyParser.json({ limit: env.BODY_LIMIT }));

// ==================== 审计（body 解析后）====================
app.use(auditMiddleware);
app.use(traceMiddleware);
app.use(metricsMiddleware);
app.get("/metrics", (req, res, next) => {
  const ip = getClientIp(req);
  const allowed = (process.env.METRICS_WHITELIST || "127.0.0.1").split(",");
  if (!allowed.includes(ip)) {
    return res.status(403).end();
  }
  metricsRouter()(req, res, next);
});
// ==================== 静态 / 文档 ====================
if (env.NODE_ENV !== "production" || env.ENABLE_DOCS === "1") {
  app.use("/api", swaggerRouter);
}
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
app.get("/health/live", (_req, res) => {
  res.json({ status: "ok" }); // 进程存活
});

app.get("/health/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    res.json({ status: "ready" });
  } catch {
    res.status(503).json({ status: "not-ready" });
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
    await sendAlert({
      level: "critical",
      title: "database_connection_failed",
      message: "数据库连接失败，服务无法启动",
      source: "database",
      data: { error: String((err as Error)?.message) },
    });
    process.exit(1);
  }

  let redisOk = false;
  try {
    await redis.ping();
    redisOk = true;
    logger.info("✅ Redis connected");
  } catch (err) {
    await sendAlert({
      level: "warning",
      title: "redis_connection_failed",
      message: "Redis 连接失败，缓存/会话/限流功能降级",
      source: "redis",
      data: { error: String((err as Error)?.message) },
    });
  }

  // 2) 后台任务（仅启动一次）
  let jobCount = 0;
  try {
    jobCount = await loadJobs(); // ⭐ 接收返回值
    startNoticeScheduler();
    initWebSocketServer(httpServer);
    await startNoticeSubscriber();
    await startForceLogoutSubscriber();
  } catch (err) {
    logger.error({ err }, "background init failed");
  }

  // 3) 启动完成横幅
  logger.info(
    {
      env: env.NODE_ENV,
      port: env.PORT,
      node: process.version,
      pid: process.pid,
      redis: redisOk ? "connected" : "unavailable",
      jobs: jobCount, // ⭐ 现在有值了
      subscribers: ["notice", "force-logout"],
    },
    "🚀 Bootstrap complete",
  );
}

// ==================== 优雅退出 ====================
let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "shutting down...");
  wsManager.sendToType("notice", {
    type: "server-shutdown",
    data: { message: "服务即将重启，请稍后重连" },
    timestamp: Date.now(),
  });

  // 等 1 秒让消息送达
  await new Promise((r) => setTimeout(r, 1000));

  // 关闭所有 WS
  wsManager.closeAll("server shutdown");
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
        logger.info(
          {
            env: env.NODE_ENV,
            port: env.PORT,
            node: process.version,
            pid: process.pid,
          },
          "🚀 Server starting",
        );

        logger.info(
          {
            database: "connected",
            redis: "connected",
            jobs: loadJobs(),
            subscribers: ["notice", "force-logout"],
          },
          "✅ Bootstrap complete",
        );

        logger.info(`📚 API Docs: http://localhost:${PORT}/api/docs`);
      });
    })
    .catch((err) => {
      logger.error({ err }, "bootstrap failed");
      process.exit(1);
    });
}
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "uncaughtException");
  void sendAlert({
    level: "critical",
    title: "uncaught_exception",
    message: `未捕获异常：${err.message}`,
    source: "process",
    data: { stack: err.stack?.slice(0, 1000) },
  });

  // 给告警发出去的时间，然后退出
  setTimeout(() => process.exit(1), 2000);
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "unhandledRejection");
  void sendAlert({
    level: "error",
    title: "unhandled_rejection",
    message: `未处理的 Promise 拒绝：${String(reason).slice(0, 200)}`,
    source: "process",
  });
});
export default app;
