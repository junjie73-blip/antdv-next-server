import "reflect-metadata";
import express, { type Express } from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import * as bodyParser from "body-parser";

import { env } from "@/config/env.js";
import { prisma } from "@/config/database.js";
import { redis } from "@/config/redis.js";
import { logger } from "@/platform/logger/index.js";
import { metricsRouter } from "@/platform/metrics/index.js";
import { swaggerRouter } from "@/platform/swagger/index.js";

import {
  errorHandler,
  notFoundHandler,
  requestContext,
} from "@/middleware/http/index.js";
import {
  authMiddleware,
  tenantResolver,
  dataScopeMiddleware,
  globalRateLimit,
  chunkUploadRateLimit,
  chunkByteRateLimit,
  fileUploadRateLimit,
  authRateLimit,
} from "@/middleware/security/index.js";
import { auditMiddleware } from "@/middleware/business/index.js";

import { controllers } from "@/modules/index.js";
import { getClientIp } from "@/shared/utils/ip.js";
import { DecoratorRouter } from "@/core/decorator/router.js";
import { ControllerScanner } from "@/core/decorator/scanner.js";

const METRICS_ALLOW = new Set(
  (env.METRICS_WHITELIST || "127.0.0.1,::1")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

export function createApp(): Express {
  const app = express();

  // 反向代理配置
  app.set("trust proxy", env.NODE_ENV === "production" ? 1 : false);

  // ① 请求上下文（traceId + 耗时 + 指标）
  app.use(requestContext());

  // ② CORS
  const allowedOrigins = env.FRONTEND_URL.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(null, false);
      },
      credentials: true,
    }),
  );

  // ③ 安全响应头
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc:
            env.NODE_ENV === "production"
              ? ["'self'", "https://cdn.jsdelivr.net"]
              : [
                  "'self'",
                  "'unsafe-inline'",
                  "'unsafe-eval'",
                  "https://cdn.jsdelivr.net",
                ],
          workerSrc: ["'self'", "blob:", "data:"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "blob:", "https:"],
          connectSrc: ["'self'", "https:"],
        },
      },
      hsts:
        env.NODE_ENV === "production"
          ? { maxAge: 31536000, includeSubDomains: true, preload: true }
          : false,
    }),
  );

  // ④ 压缩（跳过已压缩类型）
  app.use(
    compression({
      filter: (req, res) => {
        const ct = String(res.getHeader("Content-Type") ?? "");
        if (/^(image|video|audio)\//.test(ct)) return false;
        if (ct.includes("application/zip") || ct.includes("application/gzip")) {
          return false;
        }
        return compression.filter(req, res);
      },
    }),
  );

  // ⑤ Body 解析（必须在 audit 之前）
  app.use(bodyParser.urlencoded({ extended: true, limit: env.BODY_LIMIT }));
  app.use(bodyParser.json({ limit: env.BODY_LIMIT }));

  // ⑥ 审计（body 解析后）
  app.use(auditMiddleware);

  // ⑦ 文档 / 静态资源
  if (env.NODE_ENV !== "production" || env.ENABLE_DOCS === "1") {
    app.use("/api/v1", swaggerRouter);
  }
  app.use(
    "/uploads",
    express.static(path.join(process.cwd(), "uploads"), {
      maxAge: "7d",
      immutable: true,
      etag: true,
      lastModified: true,
      setHeaders: (res) => {
        res.setHeader("Cache-Control", "public, max-age=604800, immutable");
      },
    }),
  );

  // ⑧ 健康检查 / 指标
  registerHealthRoutes(app);

  // ⑨ 限流（白名单在 limiter 内部 skip）
  app.use(...globalRateLimit);
  app.use("/api/v1/upload/chunk", chunkByteRateLimit(), chunkUploadRateLimit);
  app.use("/api/v1/upload/file", ...fileUploadRateLimit);
  app.use("/api/v1/upload/merge", ...fileUploadRateLimit);
  app.use("/api/v1/auth/login", ...authRateLimit);
  app.use("/api/v1/auth/register", ...authRateLimit);
  app.use("/api/v1/auth/sms", ...authRateLimit);
  app.use("/api/v1/auth/forgot-password", ...authRateLimit);

  // ⑩ 认证链
  app.use(authMiddleware);
  app.use(tenantResolver);
  app.use(dataScopeMiddleware());

  // ⑪ 业务路由（装饰器扫描）
  const scanner = new ControllerScanner();
  scanner.register(...(controllers as any));
  app.use("/api/v1", new DecoratorRouter(scanner).build());

  // ⑫ Sentry 错误捕获（生产）
  if (env.NODE_ENV === "production" && env.SENTRY_DSN) {
    void import("@/platform/observability/sentry.js").then(({ Sentry }) => {
      Sentry.setupExpressErrorHandler(app);
    });
  }

  // ⑬ 404 / 全局错误
  app.use(notFoundHandler);
  app.use(errorHandler);

  logger.info({ controllers: controllers.length }, "[app] built");
  return app;
}

function registerHealthRoutes(app: Express): void {
  app.get("/metrics", (req, res, next) => {
    const ip = getClientIp(req);
    if (!METRICS_ALLOW.has(ip ?? "")) return res.status(404).end();
    void metricsRouter()(req, res);
  });

  app.get("/health/live", (_req, res) => {
    res.json({ status: "ok" });
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
}
