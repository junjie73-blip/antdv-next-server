import { Request, Response, NextFunction } from "express";
import { logger } from "@core/logger/index.js";
import { AppError } from "@/core/errors.js";
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      timestamp: new Date().getTime(),
    });
    return;
  }

  if (
    err.message?.includes("validation failed") ||
    err.message?.includes("Validation")
  ) {
    res.status(400).json({
      code: 400001,
      message: err.message,
      timestamp: new Date().getTime(),
    });
    return;
  }

  logger.error({ err }, "Unhandled error");
  res.status(500).json({
    code: 500000,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
    timestamp: new Date().getTime(),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    code: 404001,
    message: `path ${req.method} ${req.path} not found`,
    timestamp: new Date().getTime(),
  });
}

export { AppError } from "@/core/errors.js";
