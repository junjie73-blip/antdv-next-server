import type { Request, Response } from "express";
import { env } from "@/config/env.js";
import { AppError } from "@/core/errors.js";
import { getTraceId } from "@/core/context/index.js";
import { logger } from "@/platform/logger/index.js";
import {
  AGENT_ERROR_CODES,
  SSE_HEARTBEAT_FRAME,
  TOOL_OUTPUT_MAX_BYTES,
} from "../constants.js";
import type {
  AgentChatInput,
  BffCitation,
  BffStreamEvent,
  RawToolCall,
  ToolExecutionContext,
  ToolResultDto,
} from "../types.js";
import type { AgentHttpClient } from "./agent-http.client.js";
import { createSseParser, type RawSseFrame } from "./agent-sse.js";
import type { PendingCallStore } from "./pending-call.store.js";
import type { ToolRegistry } from "./tool-registry.js";

export interface StreamOrchestratorDeps {
  client: AgentHttpClient;
  tools: ToolRegistry;
  pending: PendingCallStore;
}

interface ConfirmInfo {
  callId: string;
  toolName: string;
  input: Record<string, unknown>;
  message: string;
}

type RoundResult =
  | {
      kind: "end";
      finishReason: string;
      toolCalls: RawToolCall[];
      confirm: ConfirmInfo | null;
      promptTokens: number;
      completionTokens: number;
    }
  | { kind: "error"; promptTokens: number; completionTokens: number }
  | { kind: "idle"; promptTokens: number; completionTokens: number }
  | { kind: "aborted"; promptTokens: number; completionTokens: number };

function clampInt(raw: string, fallback: number, min = 1): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= min ? Math.floor(n) : fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** DataScopeContext → Agent 可判定的最小结构 */
function toAgentDataScope(ds: AgentChatInput["dataScope"]): Record<string, unknown> {
  return {
    scope: ds.selfOnly ? "self" : ds.deptIds === "*" ? "all" : "dept",
    dept_ids: ds.deptIds === "*" ? [] : ds.deptIds,
    self_only: ds.selfOnly,
    roles: ds.roles ?? [],
  };
}

export class StreamOrchestrator {
  constructor(private readonly deps: StreamOrchestratorDeps) {}

  /**
   * 主入口：连接上游 → 下发响应头 → 循环转发/执行工具 → 收尾。
   * 上游连接先于响应头，使连接失败仍能走标准 JSON 错误（HTTP 503/504/400）。
   * 响应头下发后的异常一律转为 event: error 帧（HTTP 状态已定，不可改）。
   */
  async pipe(req: Request, res: Response, input: AgentChatInput): Promise<void> {
    const started = Date.now();
    const traceId = input.traceId ?? getTraceId();
    const toolSpecs = this.deps.tools.toAgentSpecs();
    const outputMaxBytes = TOOL_OUTPUT_MAX_BYTES;
    const idleMs = clampInt(env.AGENT_STREAM_IDLE_TIMEOUT_MS, 60_000);
    const heartbeatMs = clampInt(env.AGENT_HEARTBEAT_MS, 15_000);
    const maxRounds = clampInt(env.AGENT_MAX_TOOL_ROUNDS, 5);
    const controller = new AbortController();

    const ctx: ToolExecutionContext = {
      tenantId: input.tenantId,
      userId: input.userId,
      username: input.username,
      roles: input.roles,
      conversationId: input.conversationId,
      traceId,
    };

    let userMessage = input.message ?? "";
    let toolResults: ToolResultDto[] | undefined;
    let pendingEvents: BffStreamEvent[] = [];

    // 恢复流：先取出并执行待确认调用，再带着 tool_results 发新请求以从 checkpoint 恢复
    if (input.confirmedCallIds?.length) {
      const calls: RawToolCall[] = [];
      for (const callId of input.confirmedCallIds) {
        const pending = await this.deps.pending.take(input.tenantId, input.conversationId, callId);
        if (!pending) {
          // 此处仍在响应头之前，故走标准 JSON 错误（不让客户端拿到 200 流才发现过期）
          logger.warn(
            { conversationId: input.conversationId, callId, code: AGENT_ERROR_CODES.PENDING_EXPIRED },
            "[agent] 待确认调用已过期或不存在",
          );
          throw new AppError("待确认的调用已过期或不存在", 400001, 400);
        }
        if (!userMessage) userMessage = pending.userMessage;
        calls.push({ callId: pending.callId, toolName: pending.toolName, input: pending.input });
      }
      const exec = await this.deps.tools.executeBatch(calls, ctx, outputMaxBytes);
      pendingEvents = exec.events;
      toolResults = exec.results;
      logger.info(
        { conversationId: input.conversationId, confirmed: calls.length },
        "[agent] 确认续跑",
      );
    }

    if (!userMessage) throw new AppError("缺少对话内容", 400001, 400);

    const buildPayload = (): Record<string, unknown> => ({
      tenant_id: input.tenantId,
      user_id: input.userId,
      conversation_id: input.conversationId,
      messages: [{ role: "user", content: userMessage }],
      username: input.username,
      data_scope: toAgentDataScope(input.dataScope),
      tools: toolSpecs,
      tool_results: toolResults,
      trace_id: traceId ?? null,
    });

    let upstream = await this.deps.client.openChatStream(buildPayload(), controller.signal);

    // no-transform ⇒ compression 中间件自动跳过，SSE 才不会被攒着一起下发
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // 长回答可能远超默认 socket 空闲超时，禁用由我们自己的空闲计时器接管
    req.setTimeout(0);

    const heartbeat = setInterval(() => {
      if (!res.writableEnded) res.write(SSE_HEARTBEAT_FRAME);
    }, heartbeatMs);

    let clientGone = false;
    res.on("close", () => {
      clientGone = true;
      if (!res.writableEnded) controller.abort();
    });

    let rounds = 0;
    let promptTokens = 0;
    let completionTokens = 0;
    let finishReason = "stop";

    logger.info(
      {
        conversationId: input.conversationId,
        tenantId: input.tenantId,
        userId: input.userId,
        traceId,
        toolCount: toolSpecs.length,
      },
      "[agent] chat 开流",
    );

    try {
      for (const event of pendingEvents) this.write(res, event);

      for (;;) {
        if (clientGone) return;

        const outcome = await this.consumeRound(upstream, res, controller, idleMs, traceId);
        promptTokens += outcome.promptTokens;
        completionTokens += outcome.completionTokens;

        if (outcome.kind === "aborted") return;
        if (outcome.kind === "error") {
          finishReason = "error";
          break;
        }
        if (outcome.kind === "idle") {
          this.write(res, {
            type: "error",
            code: AGENT_ERROR_CODES.IDLE_TIMEOUT,
            message: "AI 服务响应超时",
            traceId,
          });
          finishReason = "error";
          break;
        }

        // 需要人工确认：暂存待确认调用，本次流到此为止（不回填 tool_result）
        if (outcome.confirm) {
          await this.deps.pending.save(input.tenantId, input.conversationId, {
            callId: outcome.confirm.callId,
            toolName: outcome.confirm.toolName,
            input: outcome.confirm.input,
            userMessage,
            createdAt: Date.now(),
          });
          this.write(res, {
            type: "confirmRequired",
            callId: outcome.confirm.callId,
            toolName: outcome.confirm.toolName,
            input: outcome.confirm.input,
            message: outcome.confirm.message,
          });
          finishReason = "confirm_required";
          controller.abort();
          break;
        }

        const hasTools = outcome.toolCalls.length > 0;
        if (outcome.finishReason !== "tool_call" || !hasTools) {
          finishReason = outcome.finishReason || "stop";
          break;
        }

        rounds += 1;
        if (rounds >= maxRounds) {
          logger.warn(
            { conversationId: input.conversationId, rounds, code: AGENT_ERROR_CODES.TOOL_LOOP_EXCEEDED },
            "[agent] 工具回环轮次超限",
          );
          this.write(res, {
            type: "error",
            code: AGENT_ERROR_CODES.TOOL_LOOP_EXCEEDED,
            message: "工具调用轮次超出上限，已中断",
            traceId,
          });
          finishReason = "tool_call_exhausted";
          break;
        }

        const exec = await this.deps.tools.executeBatch(outcome.toolCalls, ctx, outputMaxBytes);
        for (const event of exec.events) this.write(res, event);
        toolResults = exec.results;

        if (clientGone) return;
        upstream = await this.deps.client.openChatStream(buildPayload(), controller.signal);
      }

      if (!clientGone) {
        if (promptTokens > 0 || completionTokens > 0) {
          this.write(res, { type: "usage", promptTokens, completionTokens });
        }
        this.write(res, { type: "end", finishReason });
      }
    } catch (err) {
      logger.error({ err, conversationId: input.conversationId, traceId }, "[agent] 流式编排异常");
      if (!clientGone && !res.writableEnded) {
        this.write(res, {
          type: "error",
          code: AGENT_ERROR_CODES.STREAM_FAILED,
          message: "AI 服务连接中断",
          traceId,
        });
      }
    } finally {
      clearInterval(heartbeat);
      if (!clientGone) res.end();
      logger.info(
        {
          conversationId: input.conversationId,
          rounds,
          finishReason,
          durationMs: Date.now() - started,
          promptTokens,
          completionTokens,
        },
        "[agent] chat 结束",
      );
    }
  }

  /** 消费一轮上游流：解析、转换、写回前端；返回本轮终态 */
  private async consumeRound(
    upstream: ReadableStream<Uint8Array>,
    res: Response,
    controller: AbortController,
    idleMs: number,
    traceId?: string,
  ): Promise<RoundResult> {
    const reader = upstream.getReader();
    const parser = createSseParser();
    const toolCalls: RawToolCall[] = [];
    let confirm: ConfirmInfo | null = null;
    let messageId: string | null = null;
    let promptTokens = 0;
    let completionTokens = 0;
    let idleFired = false;

    const readNext = async (): Promise<ReadableStreamReadResult<Uint8Array> | "idle"> => {
      if (!idleMs) return reader.read();
      let timer: NodeJS.Timeout | undefined;
      const timeout = new Promise<"idle">((resolve) => {
        timer = setTimeout(() => {
          idleFired = true;
          resolve("idle");
        }, idleMs);
      });
      try {
        return await Promise.race([reader.read(), timeout]);
      } finally {
        if (timer) clearTimeout(timer);
      }
    };

    try {
      for (;;) {
        const chunk = await readNext();
        if (chunk === "idle") return { kind: "idle", promptTokens, completionTokens };

        const frames: RawSseFrame[] = chunk.done ? parser.flush() : parser.push(chunk.value);
        for (const frame of frames) {
          const data = this.parseFrameData(frame);
          if (!data) continue;

          switch (frame.event) {
            case "start": {
              messageId = asString(data.message_id, "") || null;
              this.write(res, { type: "start", messageId });
              break;
            }
            case "token": {
              this.write(res, {
                type: "delta",
                messageId: asString(data.message_id, "") || messageId,
                text: asString(data.delta),
              });
              break;
            }
            case "tool_call": {
              const callId = asString(data.call_id);
              const toolName = asString(data.tool_name);
              if (!callId || !toolName) break;
              toolCalls.push({ callId, toolName, input: asRecord(data.input) });
              this.write(res, { type: "toolCall", callId, toolName, input: asRecord(data.input) });
              break;
            }
            case "confirm_required": {
              const callId = asString(data.call_id);
              const toolName = asString(data.tool_name);
              if (!callId || !toolName) break;
              confirm = {
                callId,
                toolName,
                input: asRecord(data.input),
                message: asString(data.message, "请确认后继续"),
              };
              break;
            }
            case "citation": {
              this.write(res, { type: "citation", sources: this.mapCitations(data.sources) });
              break;
            }
            case "usage": {
              promptTokens += asNumber(data.prompt_tokens);
              completionTokens += asNumber(data.completion_tokens);
              break;
            }
            case "end": {
              await reader.cancel().catch(() => undefined);
              return {
                kind: "end",
                finishReason: asString(data.finish_reason, "stop"),
                toolCalls,
                confirm,
                promptTokens,
                completionTokens,
              };
            }
            case "error": {
              logger.warn(
                { code: data.code, message: data.message, traceId },
                "[agent] 上游错误帧",
              );
              this.write(res, {
                type: "error",
                code: asString(data.code, AGENT_ERROR_CODES.STREAM_FAILED),
                message: asString(data.message, "AI 服务返回错误"),
                traceId,
              });
              await reader.cancel().catch(() => undefined);
              return { kind: "error", promptTokens, completionTokens };
            }
            // tool_result 是 Agent 对 BFF 回填结果的回显，前端已有 toolResult，故不转发
            default:
              break;
          }
        }

        if (chunk.done) {
          return {
            kind: "end",
            finishReason: "stop",
            toolCalls,
            confirm,
            promptTokens,
            completionTokens,
          };
        }
      }
    } catch (err) {
      if (idleFired) return { kind: "idle", promptTokens, completionTokens };
      if (controller.signal.aborted) return { kind: "aborted", promptTokens, completionTokens };
      logger.warn({ err, traceId }, "[agent] 上游流读取失败");
      throw err;
    } finally {
      reader.releaseLock();
    }
  }

  private parseFrameData(frame: RawSseFrame): Record<string, unknown> | null {
    try {
      const parsed: unknown = JSON.parse(frame.data);
      return asRecord(parsed);
    } catch {
      logger.debug({ event: frame.event }, "[agent] 帧 data 非 JSON，已跳过");
      return null;
    }
  }

  private mapCitations(raw: unknown): BffCitation[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((item) => {
      const c = asRecord(item);
      return {
        sourceType: asString(c.source_type, "unknown"),
        sourceId: typeof c.source_id === "string" ? c.source_id : null,
        title: asString(c.title),
        url: typeof c.url === "string" ? c.url : null,
        score: asNumber(c.score),
      };
    });
  }

  /** 按 BFF 契约写回一帧 SSE；`event:` 名即 BffStreamEvent.type */
  private write(res: Response, event: BffStreamEvent): void {
    if (res.writableEnded) return;
    res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
  }
}
