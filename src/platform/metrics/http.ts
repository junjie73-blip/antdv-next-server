import client from "prom-client";
import type { Request, Response, NextFunction } from "express";
import { register } from "./registry.js";

export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "path", "status"],
  registers: [register],
});

export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration",
  labelNames: ["method", "path", "status"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
  registers: [register],
});

export const activeWsConnections = new client.Gauge({
  name: "ws_active_connections",
  help: "Active WebSocket connections",
  registers: [register],
});

export const wsConnectionsByUser = new client.Gauge({
  name: "ws_connections_by_user",
  help: "Active WebSocket connections by user",
  labelNames: ["userId"],
  registers: [register],
});

function normalizePath(req: Request): string {
  if (req.route?.path) return `${req.baseUrl}${req.route.path}`;
  return req.path
    .replace(/\/[0-9a-f-]{36}/gi, "/:id")
    .replace(/\/\d+/g, "/:id");
}

export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();
  res.on("finish", () => {
    const labels = {
      method: req.method,
      path: normalizePath(req),
      status: String(res.statusCode),
    };
    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, (Date.now() - start) / 1000);
  });
  next();
}

export function metricsRouter() {
  return async (_req: Request, res: Response) => {
    res.setHeader("Content-Type", register.contentType);
    res.end(await register.metrics());
  };
}
