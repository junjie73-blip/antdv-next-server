import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { traceStorage } from "@/core/context/trace.js";
import {
  httpRequestsTotal,
  httpRequestDuration,
} from "@/platform/metrics/index.js";
import { logger } from "@/platform/logger/index.js";

const SLOW_MS = 1000;

function normalizePath(req: Request): string {
  if (req.route?.path) return `${req.baseUrl}${req.route.path}`;
  return req.path
    .replace(/\/[0-9a-f-]{36}/gi, "/:id")
    .replace(/\/\d+/g, "/:id");
}

export function requestContext() {
  return (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers["x-trace-id"] as string) || randomUUID();
    const start = process.hrtime.bigint();
    res.setHeader("X-Trace-Id", traceId);

    traceStorage.run({ traceId }, () => {
      res.on("finish", () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        const labels = {
          method: req.method,
          path: normalizePath(req),
          status: String(res.statusCode),
        };

        httpRequestsTotal.inc(labels);
        httpRequestDuration.observe(labels, durationMs / 1000);

        if (durationMs > SLOW_MS) {
          logger.warn(
            {
              method: req.method,
              url: req.originalUrl,
              durationMs,
              status: res.statusCode,
            },
            "slow request",
          );
        }
      });
      next();
    });
  };
}
