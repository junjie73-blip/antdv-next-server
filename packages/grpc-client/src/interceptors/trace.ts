import type { Interceptor } from "@grpc/grpc-js";
import { InterceptingCall } from "@grpc/grpc-js";
import {
  context,
  propagation,
  trace,
  SpanStatusCode,
} from "@opentelemetry/api";

const tracer = trace.getTracer("grpc-client");

/**
 * 客户端 trace 拦截器
 * - 将当前 OTel context 的 traceparent 注入 metadata
 * - 创建 client span，记录 RPC 状态
 */
export const traceInterceptor: Interceptor = (options, nextCall) => {
  return new InterceptingCall(nextCall(options), {
    start(metadata, listener, next) {
      const path = (options as any).method_definition?.path ?? "unknown";
      const span = tracer.startSpan(`grpc.client.${path}`);

      const carrier: Record<string, string> = {};
      propagation.inject(trace.setSpan(context.active(), span), carrier);
      if (carrier["traceparent"]) {
        metadata.set("traceparent", carrier["traceparent"]);
      }

      next(metadata, {
        onReceiveMetadata: listener.onReceiveMetadata,
        onReceiveMessage: listener.onReceiveMessage,
        onReceiveStatus(status, nextStatus) {
          span.setStatus({
            code: status.code === 0 ? SpanStatusCode.OK : SpanStatusCode.ERROR,
            message: status.details,
          });
          span.end();
          nextStatus(status);
        },
      });
    },
  });
};
