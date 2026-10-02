import { Counter } from "prom-client";
import { register } from "./registry.js";

export const apiVersionRequestsTotal = new Counter({
  name: "api_version_requests_total",
  help: "Total requests by API version and status code class",
  labelNames: ["version", "status_class"] as const, // "2xx" / "4xx" / "5xx"
  registers: [register],
});

/** 记录一次请求（在响应结束时调用） */
export function recordApiVersionRequest(
  version: string,
  statusCode: number,
): void {
  const cls = `${Math.floor(statusCode / 100)}xx`;
  apiVersionRequestsTotal.labels(version, cls).inc();
}
