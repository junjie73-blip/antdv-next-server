import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import {
  defaultResource,
  resourceFromAttributes,
} from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { PrismaInstrumentation } from "@prisma/instrumentation";
import { logger } from "../config/logger.js";
import { env } from "../config/env.js";

let sdk: NodeSDK | null = null;
let started = false;

export function startTracing(): void {
  if (started) return;

  const endpoint = env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) {
    logger.info("[tracing] OTEL_EXPORTER_OTLP_ENDPOINT 未配置，跳过");
    return;
  }

  started = true;

  sdk = new NodeSDK({
    resource: defaultResource().merge(
      resourceFromAttributes({
        [SemanticResourceAttributes.SERVICE_NAME]:
          env.OTEL_SERVICE_NAME ?? env.APP_NAME,
        [SemanticResourceAttributes.SERVICE_VERSION]:
          env.APP_VERSION ?? "1.0.0",
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: env.NODE_ENV,
      }),
    ),
    traceExporter: new OTLPTraceExporter({ url: endpoint }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // 关闭噪音最大的 fs / dns
        "@opentelemetry/instrumentation-fs": { enabled: false },
        "@opentelemetry/instrumentation-dns": { enabled: false },
      }),
      new PrismaInstrumentation(),
    ],
  });

  sdk.start();
  logger.info({ endpoint }, "[tracing] OpenTelemetry started");
}

export async function stopTracing(): Promise<void> {
  if (sdk) {
    await sdk
      .shutdown()
      .catch((err) => logger.warn({ err }, "[tracing] shutdown failed"));
    sdk = null;
    started = false;
  }
}
