import type { Interceptor } from "@grpc/grpc-js";
import { InterceptingCall } from "@grpc/grpc-js";
import {
  context,
  propagation,
  trace,
  SpanStatusCode,
} from "@opentelemetry/api";

const tracer = trace.getTracer("grpc-server");

export const traceInterceptor: Interceptor = (options, nextCall) => {
  return new InterceptingCall(nextCall(options), {
    start(metadata, listener, next) {
      const carrier: Record<string, string> = {};
      metadata.get("traceparent").forEach((v) => {
        carrier["traceparent"] = String(v);
      });

      const parentCtx = propagation.extract(context.active(), carrier);
      const span = tracer.startSpan(
        `grpc.${options.method_definition.path}`,
        undefined,
        parentCtx,
      );

      context.with(trace.setSpan(context.active(), span), () => {
        next(metadata, {
          onReceiveMetadata: listener.onReceiveMetadata,
          onReceiveMessage: listener.onReceiveMessage,
          onReceiveStatus(status, nextStatus) {
            span.setStatus({
              code:
                status.code === 0 ? SpanStatusCode.OK : SpanStatusCode.ERROR,
              message: status.details,
            });
            span.end();
            nextStatus(status);
          },
        });
      });
    },
  });
};
