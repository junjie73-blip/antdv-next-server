import { env } from "@/config/env.js";
import { logger } from "@/platform/logger/index.js";
import { mapPool } from "@/core/concurrency/index.js";
import { checkPermission } from "@/modules/rbac/index.js";
import type {
  BffStreamEvent,
  RawToolCall,
  ToolExecutionContext,
  ToolExecutorDefinition,
  ToolResultDto,
} from "../types.js";

const ERROR_MAX = 500;

function clampInt(raw: string, fallback: number, min = 1): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= min ? Math.floor(n) : fallback;
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} 执行超时（${ms}ms）`)), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errText(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.length > ERROR_MAX ? `${msg.slice(0, ERROR_MAX)}…` : msg;
}

/** 输出经 JSON 序列化后可能过大，统一在此收敛，避免 SSE 帧被撑爆 */
function normalizeOutput(output: unknown, maxBytes: number): unknown {
  let serialized: string;
  try {
    serialized = JSON.stringify(output);
  } catch {
    return { truncated: true, reason: "输出无法序列化" };
  }
  if (serialized === undefined) return null;
  if (Buffer.byteLength(serialized, "utf8") <= maxBytes) return output;
  return {
    truncated: true,
    bytes: Buffer.byteLength(serialized, "utf8"),
    preview: serialized.slice(0, maxBytes),
  };
}

export class ToolRegistry {
  constructor(private readonly defs: Map<string, ToolExecutorDefinition>) {}

  get(name: string): ToolExecutorDefinition | undefined {
    return this.defs.get(name);
  }

  /** 发给 Agent 的 ToolSpec[]（snake_case，逐字段对齐 agent/app/models/tool.py） */
  toAgentSpecs(): Array<Record<string, unknown>> {
    return [...this.defs.values()].map((d) => ({ ...d.spec }));
  }

  /** 批量执行：并发上限 AGENT_TOOL_CONCURRENCY，单工具超时 AGENT_TOOL_TIMEOUT_MS */
  async executeBatch(
    calls: RawToolCall[],
    ctx: ToolExecutionContext,
    outputMaxBytes: number,
  ): Promise<{ results: ToolResultDto[]; events: BffStreamEvent[] }> {
    const maxPerRound = clampInt(env.AGENT_MAX_TOOL_CALLS_PER_ROUND, 8);
    const concurrency = clampInt(env.AGENT_TOOL_CONCURRENCY, 4);

    // 超出单轮上限的直接以 denied 回填，避免单轮无界工具风暴
    const overflow = calls.slice(maxPerRound).map<ToolResultDto>((c) => ({
      call_id: c.callId,
      tool_name: c.toolName,
      status: "denied",
      error: "超出单轮工具调用上限",
      duration_ms: 0,
    }));
    const accepted = calls.slice(0, maxPerRound);

    const settled = await mapPool(
      accepted,
      (call) => this.executeOne(call, ctx, outputMaxBytes),
      { concurrency, label: "agent-tool" },
    );

    const results = settled.map((r, i) =>
      r instanceof Error
        ? {
            call_id: accepted[i].callId,
            tool_name: accepted[i].toolName,
            status: "failed" as const,
            error: errText(r),
            duration_ms: 0,
          }
        : r,
    );

    const all = [...results, ...overflow];
    return {
      results: all,
      events: all.map(
        (r): BffStreamEvent => ({
          type: "toolResult",
          callId: r.call_id,
          toolName: r.tool_name,
          status: r.status,
          output: r.output,
          error: r.error,
          durationMs: r.duration_ms,
        }),
      ),
    };
  }

  private async executeOne(
    call: RawToolCall,
    ctx: ToolExecutionContext,
    outputMaxBytes: number,
  ): Promise<ToolResultDto> {
    const started = Date.now();
    const base = {
      call_id: call.callId,
      tool_name: call.toolName,
      duration_ms: 0,
    };

    const def = this.defs.get(call.toolName);
    if (!def) {
      logger.warn(
        { callId: call.callId, toolName: call.toolName, userId: ctx.userId, reason: "unregistered" },
        "[agent-tool] 工具未注册",
      );
      return { ...base, status: "denied", error: "工具未注册" };
    }

    // 权限判定 fail-closed：有声明就必须通过校验
    const perm = def.spec.required_permission;
    if (perm) {
      let allowed = false;
      try {
        allowed = await checkPermission(ctx.userId, ctx.tenantId, perm);
      } catch (err) {
        logger.warn({ err, callId: call.callId, perm }, "[agent-tool] 权限校验异常，按拒绝处理");
      }
      if (!allowed) {
        logger.warn(
          { callId: call.callId, toolName: call.toolName, userId: ctx.userId, reason: "forbidden", perm },
          "[agent-tool] 无权限执行工具",
        );
        return { ...base, status: "denied", error: "无权限执行该工具" };
      }
    }

    const parsed = def.inputSchema.safeParse(call.input);
    if (!parsed.success) {
      const summary = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      logger.warn(
        { callId: call.callId, toolName: call.toolName, summary },
        "[agent-tool] 入参校验失败",
      );
      return { ...base, status: "failed", error: `参数不合法：${summary}` };
    }

    const maxRetry = def.spec.mutating ? 0 : Math.max(0, Number(env.AGENT_RETRY_MAX));
    const timeoutMs = clampInt(env.AGENT_TOOL_TIMEOUT_MS, 15_000);
    let lastErr: unknown;

    for (let attempt = 0; attempt <= maxRetry; attempt += 1) {
      try {
        const output = await withTimeout(
          def.run(parsed.data, ctx),
          timeoutMs,
          `工具 ${call.toolName}`,
        );
        const duration = Date.now() - started;
        logger.info(
          {
            callId: call.callId,
            toolName: call.toolName,
            tenantId: ctx.tenantId,
            conversationId: ctx.conversationId,
            status: "success",
            durationMs: duration,
            traceId: ctx.traceId,
          },
          "[agent-tool] 执行成功",
        );
        return {
          ...base,
          status: "success",
          output: normalizeOutput(output, outputMaxBytes),
          duration_ms: duration,
        };
      } catch (err) {
        lastErr = err;
        if (attempt < maxRetry) await sleep(200 * 2 ** attempt);
      }
    }

    const duration = Date.now() - started;
    logger.warn(
      {
        callId: call.callId,
        toolName: call.toolName,
        status: "failed",
        durationMs: duration,
        err: lastErr,
      },
      "[agent-tool] 执行失败",
    );
    return { ...base, status: "failed", error: errText(lastErr), duration_ms: duration };
  }
}
