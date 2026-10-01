import { trace, context, SpanStatusCode, SpanKind } from "@opentelemetry/api";
import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";

const tracer = trace.getTracer("saas-admin", "1.0.0");

interface AuthUser {
  userId?: string;
  tenantId?: string;
  username?: string;
}

/**
 * TraceId 中间件
 * - 生成或透传 traceId
 * - 记录请求 span
 * - 写入响应头
 */
export function traceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // 优先用上游透传的 traceId
  const upstreamTraceId = req.headers["x-trace-id"] as string | undefined;
  const traceId = upstreamTraceId ?? randomUUID();

  (req as any).traceId = traceId;
  res.setHeader("x-trace-id", traceId);

  const user = (req as any).user as AuthUser | undefined;
  const tenantId = (req as any).tenantId;

  const span = tracer.startSpan(
    `${req.method} ${req.route?.path ?? req.path}`,
    {
      kind: SpanKind.SERVER,
      attributes: {
        "http.method": req.method,
        "http.url": req.originalUrl,
        "http.target": req.path,
        "http.host": req.get("host") ?? "",
        "http.user_agent": req.get("user-agent") ?? "",
        "http.scheme": req.protocol,
        "http.client_ip": req.ip ?? "",

        "saas.trace_id": traceId,
        "saas.tenant_id": tenantId ?? "",
        "saas.user_id": user?.userId ?? "",
        "saas.username": user?.username ?? "",
      },
    },
  );

  // 把 span 放入 context，后续异步调用自动关联
  context.with(trace.setSpan(context.active(), span), () => {
    const startTime = process.hrtime.bigint();

    res.on("finish", () => {
      const durationNs = process.hrtime.bigint() - startTime;
      const durationMs = Number(durationNs) / 1_000_000;

      span.setAttribute("http.status_code", res.statusCode);
      span.setAttribute("http.duration_ms", durationMs.toFixed(2));

      if (res.statusCode >= 500) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `HTTP ${res.statusCode}`,
        });
      } else if (res.statusCode >= 400) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `HTTP ${res.statusCode}`,
        });
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
      }

      span.end();
    });

    res.on("close", () => {
      // 客户端提前断开
      if (!res.writableEnded) {
        span.setAttribute("http.aborted", true);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Client aborted",
        });
        span.end();
      }
    });

    next();
  });
}

/**
 * 手动埋点辅助
 */
export function withSpan<T>(
  name: string,
  attributes: Record<string, any>,
  fn: () => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      for (const [k, v] of Object.entries(attributes)) {
        span.setAttribute(k, String(v));
      }
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err: any) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err?.message ?? "unknown",
      });
      span.recordException(err);
      throw err;
    } finally {
      span.end();
    }
  });
}
