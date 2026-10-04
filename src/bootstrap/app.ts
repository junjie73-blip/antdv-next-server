import "reflect-metadata";
import express, { Router, type Express } from "express";
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

import { errorHandler, notFoundHandler, requestContext } from "@/middleware/http/index.js";
import {
  authMiddleware,
  tenantResolver,
  dataScopeMiddleware,
  globalRateLimit,
  chunkUploadRateLimit,
  chunkByteRateLimit,
  fileUploadRateLimit,
  authRateLimit,
  csrfGuard,
  issueCsrfToken,
} from "@/middleware/security/index.js";
import { auditMiddleware } from "@/middleware/business/index.js";

import { controllers } from "@/modules/index.js";
import { getClientIp } from "@/shared/utils/ip.js";
import { DecoratorRouter } from "@/core/decorator/router.js";
import { ControllerScanner } from "@/core/decorator/scanner.js";
import cookieParser from "cookie-parser";
import { traceMiddleware } from "@/platform/observability/tracing/index.js";
import { buildQueueDashboardRouter } from "@/platform/queue/dashboard.js";
import { apiVersionContext } from "@/middleware/http/api-version.js";
import {
  getDefaultVersions,
  getMountableVersions,
  loadApiVersions,
} from "@/platform/api-version/registry.js";
import { apiVersionLifecycle } from "@/platform/api-version/lifecycle.js";
import { recordApiVersionRequest } from "@/platform/metrics/api-version.js";
import { tenantProbeContext } from "@/middleware/http/tenant-probe-context.js";
import { orgHistoryContextMiddleware } from "@/middleware/http/org-history-context.js";
const METRICS_ALLOW = new Set(
  (env.METRICS_WHITELIST || "127.0.0.1,::1")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

export async function createApp(): Promise<Express> {
  const app = express();

  // 反向代理配置
  app.set("trust proxy", env.NODE_ENV === "production" ? 1 : false);
  app.use(traceMiddleware);
  // ① 请求上下文（traceId + 耗时 + 指标）
  app.use(requestContext());
  app.use(cookieParser());
  // 每次请求时确保有 CSRF Token
  app.use((req, res, next) => {
    if (!req.cookies?.["_csrf_token"]) {
      issueCsrfToken(res);
    }
    next();
  });

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
              : ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
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
    app.use("/api/docs", swaggerRouter); // 与 ui.ts 内部 "/" 和 "/json" 组合成 /api/docs
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
  app.use(apiVersionContext());
  const allVersions = await loadApiVersions();
  const mountable = getMountableVersions(allVersions);
  const defaultVersions = getDefaultVersions(allVersions);
  // ⑨ 限流（白名单在 limiter 内部 skip）
  app.use(...globalRateLimit);

  for (const v of defaultVersions) {
    console.log(v, "v");
    app.use(`/api/${v}/auth/login`, ...authRateLimit);
    app.use(`/api/${v}/upload/chunk`, chunkByteRateLimit(), ...chunkUploadRateLimit);
    app.use(`/api/${v}/upload/check`, ...fileUploadRateLimit);
    app.use(`/api/${v}/upload/merge`, ...fileUploadRateLimit);
    app.use(`/api/${v}/auth/login`, ...authRateLimit);
    app.use(`/api/${v}/auth/register`, ...authRateLimit);
    app.use(`/api/${v}/auth/sms`, ...authRateLimit);
    app.use(`/api/${v}/auth/forgot-password`, ...authRateLimit);
  }

  // ⑩ 认证链
  app.use(authMiddleware);
  app.use(tenantResolver);
  app.use(tenantProbeContext());
  app.use(dataScopeMiddleware());
  app.use(orgHistoryContextMiddleware());
  // ⑪ 业务路由（装饰器扫描）
  const scanner = new ControllerScanner();
  scanner.register(...(controllers as any));
  const router = new DecoratorRouter(scanner, defaultVersions);
  for (const v of mountable) {
    const queueDashboard = buildQueueDashboardRouter();
    if (queueDashboard) {
      app.use(`/api/${v.code}/monitor/queue`, queueDashboard);
    }

    const versionRouter = Router();
    versionRouter.use(apiVersionLifecycle(v.code));
    versionRouter.use((req, res, next) => {
      res.on("finish", () => recordApiVersionRequest(v.code, res.statusCode));
      next();
    });
    // versionRouter.use();
    app.use(`/api/${v.code}`, router.buildForVersion(v.code));

    logger.info({ version: v.code, status: v.status }, "[api-version] mounted");
  }
  // 校验
  app.use(csrfGuard);
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
