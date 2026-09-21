import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { env } from "@/config/env.js";

export function initSentry(): void {
  if (!env.SENTRY_DSN) return;
  Sentry.init({
    dsn: env.SENTRY_DSN,
    integrations: [
      nodeProfilingIntegration(),
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
      Sentry.prismaIntegration(),
    ],
    tracesSampleRate: 1.0,
    profileSessionSampleRate: 1.0,
    profileLifecycle: "trace",
  });
}

export * as Sentry from "@sentry/node";
