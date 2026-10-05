import { createHmac } from "node:crypto";
import { env } from "@/config/env.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import {
  AGENT_API_PREFIX,
  AGENT_HEADER_TIMESTAMP,
  AGENT_HEADER_TOKEN,
  AGENT_HEADER_TRACE,
} from "../constants.js";

/** 上游错误体最大登记长度，避免把整段上游堆栈写进日志 */
const UPSTREAM_MSG_MAX = 200;

interface CallOptions {
  /** 是否允许重试（默认允许；工具类写操作可显式关闭） */
  retry?: boolean;
  /** 透传 BFF traceId，便于 Agent 侧日志串联 */
  traceId?: string;
}

function assertConfigured(): void {
  if (!env.AGENT_ENABLED) {
    throw new AppError("AI 服务未启用", 500001, 503);
  }
  if (!env.AGENT_INTERNAL_SECRET) {
    logger.error("[agent] AGENT_INTERNAL_SECRET 未配置，无法调用 Agent 服务");
    throw new AppError("Agent 集成未配置 AGENT_INTERNAL_SECRET", 500001, 500);
  }
}

/** 与 agent/app/security/hmac.py 的 sign_timestamp 等价：秒级时间戳的 HMAC-SHA256 hex */
function signTimestamp(secret: string, timestampSeconds: number): string {
  return createHmac("sha256", secret).update(String(timestampSeconds)).digest("hex");
}

function buildAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const secret = env.AGENT_INTERNAL_SECRET as string;
  const ts = Math.floor(Date.now() / 1000);
  return {
    [AGENT_HEADER_TOKEN]: signTimestamp(secret, ts),
    [AGENT_HEADER_TIMESTAMP]: String(ts),
    ...extra,
  };
}

function url(path: string): string {
  return `${env.AGENT_BASE_URL.replace(/\/$/, "")}${path}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function truncate(text: string, max = UPSTREAM_MSG_MAX): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

async function readMessage(res: Response): Promise<string> {
  try {
    const text = await res.text();
    if (!text) return "";
    try {
      const parsed: unknown = JSON.parse(text);
      if (parsed && typeof parsed === "object") {
        const msg = (parsed as Record<string, unknown>).message;
        if (typeof msg === "string" && msg) return msg;
        const detail = (parsed as Record<string, unknown>).detail;
        if (typeof detail === "string" && detail) return detail;
      }
    } catch {
      // 非 JSON 错误体，直接用原文
    }
    return text;
  } catch {
    return "";
  }
}

/** 统一的上游错误 → AppError 映射（见实施方案 §4.3 表） */
async function mapUpstreamError(res: Response): Promise<AppError> {
  const status = res.status;
  const upstreamMsg = truncate(await readMessage(res));

  if (status === 401) {
    // HMAC 失败属 BFF 配置问题，不回显上游细节，只记日志
    logger.error({ status, upstreamMsg }, "[agent] 上游认证失败，请检查 AGENT_INTERNAL_SECRET");
    return new AppError("Agent 内部认证失败", 500001, 500);
  }
  if (status >= 500) {
    logger.warn({ status, upstreamMsg }, "[agent] 上游服务异常");
    return new AppError("AI 服务暂时不可用，请稍后重试", 503001, 503);
  }
  return new AppError(upstreamMsg || "请求参数不被 AI 服务接受", 400001, 400);
}

function mapNetworkError(err: unknown): AppError {
  if (err instanceof Error && err.name === "TimeoutError") {
    return new AppError("AI 服务响应超时", 504001, 504);
  }
  if (err instanceof AppError) return err;
  return new AppError("AI 服务暂时不可用，请稍后重试", 503001, 503);
}

export class AgentHttpClient {
  /** 非流式调用：HMAC 签名 + 超时 + 出站重试 */
  async postJson<T>(
    path: string,
    body: Record<string, unknown>,
    opts: CallOptions = {},
  ): Promise<T> {
    assertConfigured();
    const retry = opts.retry !== false;
    const maxRetry = retry ? Math.max(0, Number(env.AGENT_RETRY_MAX)) : 0;

    let lastErr: unknown;
    for (let attempt = 0; attempt <= maxRetry; attempt += 1) {
      const started = Date.now();
      try {
        const res = await fetch(url(`${AGENT_API_PREFIX}${path}`), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(opts.traceId ? { [AGENT_HEADER_TRACE]: opts.traceId } : undefined),
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(Number(env.AGENT_TIMEOUT_MS)),
        });

        if (!res.ok) {
          const mapped = await mapUpstreamError(res);
          // 5xx 属可重试；4xx/401 直接抛出，避免无意义重试
          if (res.status >= 500 && attempt < maxRetry) {
            lastErr = mapped;
            await sleep(200 * 2 ** attempt);
            continue;
          }
          throw mapped;
        }

        logger.debug({ path, ms: Date.now() - started }, "[agent] postJson ok");
        return (await res.json()) as T;
      } catch (err) {
        lastErr = err;
        const retriable =
          !(err instanceof AppError) ||
          (err.code === 503001 && attempt < maxRetry);
        if (retriable && attempt < maxRetry) {
          logger.warn({ path, attempt, err }, "[agent] postJson 重试");
          await sleep(200 * 2 ** attempt);
          continue;
        }
        logger.warn({ path, status: "failed", err }, "[agent] postJson 失败");
        throw mapNetworkError(err);
      }
    }
    throw mapNetworkError(lastErr);
  }

  /**
   * 建立 chat SSE 连接。失败（非 2xx / 网络错误）在此抛出 —— 此时响应头尚未下发，
   * 调用方可安全地让全局 errorHandler 输出标准 JSON 错误。
   */
  async openChatStream(
    payload: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<ReadableStream<Uint8Array>> {
    assertConfigured();
    const started = Date.now();

    // 连接阶段用独立超时；fetch 成功后清掉定时器，后续由调用方的空闲超时接管
    const connController = new AbortController();
    const timer = setTimeout(
      () => connController.abort(new Error("connect timeout")),
      Number(env.AGENT_TIMEOUT_MS),
    );
    const combined = AbortSignal.any([signal, connController.signal]);

    try {
      const res = await fetch(url(`${AGENT_API_PREFIX}/chat`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          ...buildAuthHeaders(
            payload.trace_id ? { [AGENT_HEADER_TRACE]: String(payload.trace_id) } : undefined,
          ),
        },
        body: JSON.stringify(payload),
        signal: combined,
      });

      if (!res.ok || !res.body) {
        throw await mapUpstreamError(res);
      }

      logger.info({ ms: Date.now() - started }, "[agent] chat 上游已连接");
      return res.body;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.warn({ err }, "[agent] chat 上游连接失败");
      throw mapNetworkError(err);
    } finally {
      clearTimeout(timer);
    }
  }

  /** 探测 Agent 健康（GET /health、/ready，无 HMAC，不抛错） */
  async probe(): Promise<{ healthy: boolean; ready: boolean; detail?: unknown }> {
    const base = env.AGENT_BASE_URL.replace(/\/$/, "");
    const timeout = AbortSignal.timeout(Math.min(Number(env.AGENT_TIMEOUT_MS), 10_000));

    const check = async (path: string): Promise<{ ok: boolean; detail?: unknown }> => {
      try {
        const res = await fetch(`${base}${path}`, { signal: timeout });
        if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };
        return { ok: true, detail: await res.json().catch(() => null) };
      } catch (err) {
        return { ok: false, detail: err instanceof Error ? err.message : String(err) };
      }
    };

    const [health, ready] = await Promise.all([check("/health"), check("/ready")]);
    return { healthy: health.ok, ready: ready.ok, detail: { health: health.detail, ready: ready.detail } };
  }
}

export const agentHttpClient = new AgentHttpClient();
