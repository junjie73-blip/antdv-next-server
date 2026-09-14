import { logger } from "@/core/logger/index.js";
import { Request, Response, NextFunction } from "express";

const SLOW_THRESHOLD_MS = 1000;

export function timingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (duration > SLOW_THRESHOLD_MS) {
      logger.warn(
        { method: req.method, url: req.originalUrl, duration },
        "slow request",
      );
    }
  });
  next();
}
