// src/middleware/timing.ts
import { logger } from "@/core/logger/logger.js";
import { Request, Response, NextFunction } from "express";

export function timingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.debug(
      { method: req.method, url: req.originalUrl, duration },
      "request timing",
    );
  });
  next();
}
