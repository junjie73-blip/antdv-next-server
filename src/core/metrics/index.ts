import client from "prom-client";
import type { Request, Response, NextFunction } from "express";

export const register = new client.Registry();
client.collectDefaultMetrics({ register });

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

export const dbQueryDuration = new client.Histogram({
  name: "db_query_duration_seconds",
  help: "Prisma query duration",
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

export const activeWsConnections = new client.Gauge({
  name: "ws_active_connections",
  help: "Active WebSocket connections",
  registers: [register],
});

export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const start = Date.now();
  res.on("finish", () => {
    // 归一化路径（避免 user/123 与 user/456 分成两个指标）
    const path = req.route?.path
      ? `${req.baseUrl}${req.route.path}`
      : req.path.replace(/\/[0-9a-f-]{36}/gi, "/:id");
    const labels = { method: req.method, path, status: String(res.statusCode) };
    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, (Date.now() - start) / 1000);
  });
  next();
}

export function metricsRouter() {
  return async (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Content-Type", register.contentType);
    res.end(await register.metrics());
    next();
  };
}
export const wsConnectionsByUser = new client.Gauge({
  name: "ws_connections_by_user",
  help: "Active WebSocket connections by user",
  labelNames: ["userId"],
  registers: [register],
});
