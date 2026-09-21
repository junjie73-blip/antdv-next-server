import { Request, Response, NextFunction } from "express";
import { logger } from "@/platform/logger/index.js";
import { AppError } from "@/core/errors.js";
import { env } from "@/config/env.js";
import { getTraceId } from "@/core/context/trace.js";
import * as Sentry from "@sentry/node";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  (req as any).__errorMsg =
    err instanceof AppError
      ? err.message
      : (err as Error)?.message?.slice(0, 200);

  const status = err instanceof AppError ? err.statusCode : 500;
  const code = err instanceof AppError ? err.code : 500000;
  const message =
    err instanceof AppError
      ? err.message
      : env.NODE_ENV === "production"
        ? "Internal server error"
        : (err as Error)?.message;

  if (status >= 500) {
    logger.error({ err, traceId: getTraceId() }, "Unhandled error");
    if (env.NODE_ENV === "production" && env.SENTRY_DSN) {
      Sentry.captureException(err);
    }
  } else {
    logger.warn({ err, traceId: getTraceId() }, "Request failed");
  }

  if (res.headersSent) return;
  res.status(status).json({
    code,
    message,
    data: null,
    traceId: getTraceId(),
    timestamp: Date.now(),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    code: 404001,
    message: `path ${req.method} ${req.path} not found`,
    timestamp: Date.now(),
  });
}

export { AppError } from "@/core/errors.js";
