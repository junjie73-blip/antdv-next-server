import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import {
  defaultResource,
  resourceFromAttributes,
} from "@opentelemetry/resources";
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
  SEMRESATTRS_HOST_NAME,
} from "@opentelemetry/semantic-conventions";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import os from "node:os";
import { logger } from "@/platform/logger/index.js";

let sdk: NodeSDK | null = null;

export interface TracingConfig {
  enabled: boolean;
  serviceName: string;
  serviceVersion: string;
  environment: string;
  exporterUrl?: string;
}

/**
 * 启动 OpenTelemetry
 * 注意：必须在其他模块之前 import 并调用（第一行）
 */
export function startTracing(config: TracingConfig): void {
  if (!config.enabled) {
    logger.info("[tracing] disabled");
    return;
  }

  if (sdk) {
    logger.warn("[tracing] already started");
    return;
  }

  try {
    const resource = defaultResource().merge(
      resourceFromAttributes({
        [SEMRESATTRS_SERVICE_NAME]: config.serviceName,
        [SEMRESATTRS_SERVICE_VERSION]: config.serviceVersion,
        [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: config.environment,
        [SEMRESATTRS_HOST_NAME]: os.hostname(),
        "process.pid": process.pid,
      }),
    );

    const exporterUrl = config.exporterUrl ?? "http://localhost:4318/v1/traces";
    const traceExporter = new OTLPTraceExporter({
      url: exporterUrl,
      timeoutMillis: 10_000,
    });

    sdk = new NodeSDK({
      resource,
      traceExporter,
      spanProcessor: new BatchSpanProcessor(traceExporter, {
        maxQueueSize: 2048,
        maxExportBatchSize: 512,
        scheduledDelayMillis: 5_000,
        exportTimeoutMillis: 30_000,
      }),
      instrumentations: [
        getNodeAutoInstrumentations({
          // ============================================================
          // 精细化控制：关闭噪音大的埋点
          // ============================================================
          "@opentelemetry/instrumentation-fs": { enabled: false },
          "@opentelemetry/instrumentation-dns": { enabled: false },
          "@opentelemetry/instrumentation-net": { enabled: false },
          // HTTP 保留（关键）
          "@opentelemetry/instrumentation-http": {
            enabled: true,
            ignoreIncomingRequestHook: (req) => {
              // 忽略健康检查和静态资源
              const url = req.url ?? "";
              return (
                url.startsWith("/health") ||
                url.startsWith("/metrics") ||
                url.startsWith("/favicon") ||
                url.startsWith("/static")
              );
            },
          },
          // Express 保留
          "@opentelemetry/instrumentation-express": { enabled: true },
          // 数据库
          "@opentelemetry/instrumentation-pg": { enabled: true },
          // Redis
          "@opentelemetry/instrumentation-ioredis": { enabled: true },
          //   // Prisma（第三方包，需单独安装，此处暂关）
          //   '@prisma/instrumentation': { enabled: false },
        }),
      ],
    });

    sdk.start();
    logger.info(
      { serviceName: config.serviceName, exporterUrl },
      "[tracing] OpenTelemetry started",
    );
  } catch (err) {
    logger.error({ err }, "[tracing] 启动失败");
    // ⭐ 不阻断启动
  }
}

/**
 * 优雅关闭（flush 未发送的 span）
 */
export async function stopTracing(): Promise<void> {
  if (!sdk) return;
  try {
    await sdk.shutdown();
    logger.info("[tracing] stopped");
  } catch (err) {
    logger.error({ err }, "[tracing] 关闭失败");
  } finally {
    sdk = null;
  }
}
