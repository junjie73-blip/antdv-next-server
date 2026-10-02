import pino from "pino";
import { env as config } from "@/config/env.js";
import { combinedStream, errorStream } from "./transports.js";
import { baseFormatter, redactPaths } from "./formatters.js";
import { buildLokiTransport } from "@/platform/logging/loki-transport.js";
export const logger = pino(
  {
    level: config.LOG_LEVEL,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: baseFormatter,
    redact: { paths: redactPaths, remove: true, censor: "[REDACTED]" },
    base: undefined,
    ...buildLokiTransport(config.LOKI_URL),
  },
  pino.multistream([
    {
      stream: process.stdout,
      level: config.NODE_ENV === "development" ? "debug" : "info",
    },
    { stream: combinedStream, level: "info" },
    { stream: errorStream, level: "error" },
  ]),
);
