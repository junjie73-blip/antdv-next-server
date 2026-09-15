import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { traceStorage } from "@/core/logger/trace-context.js";

export function traceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const traceId = (req.headers["x-trace-id"] as string) || randomUUID();
  res.setHeader("X-Trace-Id", traceId);
  traceStorage.run({ traceId }, () => next());
}
