import "reflect-metadata";
import serverless from "serverless-http";
import "dotenv/config";
import express, { Request, Response } from "express";
import path from "path";
import { prisma } from "@/config/database.js";
import { redis } from "@/config/redis.js";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { errorHandler, notFoundHandler } from "@middleware/error-handler.js";
import * as bodyParser from "body-parser";
import { ddosProtection } from "@middleware/ddos.js";
import { globalRateLimit } from "@middleware/rate-limit.js";
import { swaggerRouter } from "./core/swagger/index.js";
import { ControllerScanner, DecoratorRouter } from "@core/decorator/index.js";
import { controllers } from "./modules/index.js";
import { startNoticeScheduler } from "./modules/notice/scheduler.js";
import { startNoticeSubscriber } from "@/core/redis/pubsub.js";
import { initWebSocketServer } from "@/core/ws/server.js";
import { createServer } from "http";
import { authMiddleware } from "./middleware/auth.js";
import { auditMiddleware } from "./middleware/audit.js";
import { timingMiddleware } from "./middleware/timing.js";
import { env } from "./config/env.js";
import { loadJobs } from "./modules/job/scheduler.js";
import { ipRuleMiddleware } from "./middleware/ip-rule.js";
import { startForceLogoutSubscriber } from "./core/ws/force-logout.js";
import { dataScopeMiddleware } from "./middleware/data-scope.js";
import { tenantResolver } from "./middleware/tenant-resolver.js";
import { drainAuditQueue } from "./core/audit/queue.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const _server = createServer(app);
// 1. Helmet 配置
app.use(
  helmet({
    contentSecurityPolicy:
      env.NODE_ENV === "development"
        ? false
        : {
            directives: {
              defaultSrc: ["'self'"],
              connectSrc: ["'self'", "http://localhost:9080"],
              scriptSrc: ["'self'", "'unsafe-inline'"],
            },
          },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  }),
);

app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
app.use(compression());
// 2. DDoS 防护（最外层）
app.use(ddosProtection);
// 3. 频率限制
app.use(globalRateLimit);
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(auditMiddleware);
// Swagger UI
app.use("/api", swaggerRouter);
app.use(authMiddleware);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(ipRuleMiddleware);
app.use(timingMiddleware);
app.use(tenantResolver);
app.use(dataScopeMiddleware());
// Decorator-based routes
const scanner = new ControllerScanner();
scanner.register(...controllers);

const decoratorRouter = new DecoratorRouter(scanner);
app.use("/api/v1", decoratorRouter.build());

// 启动时验证连接
async function bootstrap() {
  // 1) 验证连接
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database connected");
  } catch (e) {
    console.error("❌ Database failed", e);
    process.exit(1);
  }

  try {
    await redis.ping();
    console.log("✅ Redis connected");
  } catch (e) {
    console.error("⚠️ Redis failed", e);
  }

  // 2) 启动后台任务（只在启动时执行一次）
  await loadJobs();
  startNoticeScheduler();
  initWebSocketServer(_server);
  await startNoticeSubscriber();
  await startForceLogoutSubscriber();
}

// 健康检查
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: "degraded" });
  }
});

// 全局错误处理

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);
const PORT = process.env.PORT || 3000;
async function shutdown(signal: string) {
  console.log(`[shutdown] ${signal}`);
  await drainAuditQueue();
  process.exit(0);
}
bootstrap().then(() => {
  _server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API Docs: http://localhost:${PORT}/docs`);
  });
});
// 优雅关闭
process.on("SIGTERM", () => {
  shutdown("SIGTERM");
  _server.close(() => process.exit(0));
});
process.on("SIGINT", () => shutdown("SIGINT"));
const handler =
  process.env.NODE_ENV !== "production"
    ? app
    : serverless(app, {
        requestId: "x-request-id",
      });

export default handler;
