import type { LoggerOptions } from "pino";

/**
 * 构建 Pino 的 Loki transport（仅在配置 LOKI_URL 时启用）
 * - 与 pino-pretty / rotating-file 可同时使用
 */
export function buildLokiTransport(
  lokiUrl: string | undefined,
): LoggerOptions["transport"] | undefined {
  if (!lokiUrl) return undefined;

  return {
    targets: [
      {
        target: "pino-loki",
        level: "info",
        options: {
          host: lokiUrl,
          batching: true,
          interval: 5,
          labels: {
            app: process.env.APP_NAME ?? "antdv",
            env: process.env.NODE_ENV ?? "development",
            service: process.env.OTEL_SERVICE_NAME ?? "api",
          },
          // 结构化字段直接透传
          propsToLabels: ["tenantId", "module"],
        },
      },
    ],
  };
}
