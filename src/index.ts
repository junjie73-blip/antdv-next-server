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
app.use(auditMiddleware);
// 3. 频率限制
app.use(globalRateLimit);
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(authMiddleware);
app.use(timingMiddleware);
// Swagger UI
app.use("/api", swaggerRouter);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// Decorator-based routes
const scanner = new ControllerScanner();
scanner.register(...controllers);

const decoratorRouter = new DecoratorRouter(scanner);
app.use("/api/v1", decoratorRouter.build());

// 启动时验证连接
async function healthCheck() {
  console.log("DATABASE_URL:", process.env.DATABASE_URL);
  try {
    await prisma.$queryRaw`SELECT 1`;
    startNoticeScheduler();
    initWebSocketServer(_server);
    // 启动 Redis 订阅（用于多实例通知广播）
    startNoticeSubscriber();

    console.log("✅ Neon PostgreSQL connected");
  } catch (e) {
    console.error("❌ Neon PostgreSQL failed");
    console.error("Error stack:", e?.stack);
    if (e?.cause) console.error("Cause:", e.cause);
    if (e?.errors) console.error("Aggregate errors:", e.errors);
  }

  try {
    await redis.ping();
    console.log("✅ Upstash Redis connected");
  } catch (e) {
    console.error("❌ Upstash Redis failed", e);
  }
}

healthCheck();
// 健康检查
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 全局错误处理

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);
const PORT = process.env.PORT || 3000;
const server = _server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/docs`);
});

// 优雅关闭
process.on("SIGTERM", () => {
  _server.close(() => process.exit(0));
});
console.log("NODE_ENV:", process.env.NODE_ENV);
const handler =
  process.env.NODE_ENV !== "production"
    ? app
    : serverless(app, {
        requestId: "x-request-id",
      });

export default handler;
