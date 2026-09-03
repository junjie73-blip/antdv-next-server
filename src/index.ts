import "reflect-metadata";
import "dotenv/config";
import express, { Request, Response } from "express";
import path from "path";
import { prisma } from "@/config/database.js";
import { redis } from "@/config/redis.js";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { errorHandler } from "@middleware/error-handler.js";
import * as bodyParser from "body-parser";
import { createRegistry, mountSwagger } from "@core/swagger.js";
import { registerController } from "@core/scanner.js";
import { controllers } from "./modules/index.js";
import { ddosProtection } from "@middleware/ddos.js";
import { globalRateLimit } from "@middleware/rate-limit.js";
import { logger } from "./common/logger/index.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// 1. Helmet 配置
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
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

// 5. 日志记录（访问日志）
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    logger.info({
      type: "access",
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: Date.now() - start,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  });
  next();
});
// 同步注册所有 Controller
const registry = createRegistry();
for (const ControllerClass of controllers) {
  registerController(app, ControllerClass, registry);
}

// 挂载 Swagger UI
mountSwagger(app, registry);

// 启动时验证连接
async function healthCheck() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Neon PostgreSQL connected");
  } catch (e) {
    console.error("❌ Neon PostgreSQL failed", e);
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
app.use(errorHandler);
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
});

// 优雅关闭
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => process.exit(0));
});
export default app;
