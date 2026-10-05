import type { ZodType } from "zod";
import type { DataScopeContext } from "@/core/context/data-scope.js";

/** BFF 对前端暴露的 SSE 事件类型（与 Agent 契约解耦，见实施方案 §3.3） */
export type BffStreamEventType =
  | "start"
  | "delta"
  | "toolCall"
  | "toolResult"
  | "confirmRequired"
  | "citation"
  | "usage"
  | "end"
  | "error";

export interface BffCitation {
  sourceType: string;
  sourceId: string | null;
  title: string;
  url: string | null;
  score: number;
}

export type ToolExecutionStatus = "success" | "failed" | "denied";

export type BffStreamEvent =
  | { type: "start"; messageId: string | null }
  | { type: "delta"; messageId: string | null; text: string }
  | {
      type: "toolCall";
      callId: string;
      toolName: string;
      input: Record<string, unknown>;
    }
  | {
      type: "toolResult";
      callId: string;
      toolName: string;
      status: ToolExecutionStatus;
      output?: unknown;
      error?: string;
      durationMs?: number;
    }
  | {
      type: "confirmRequired";
      callId: string;
      toolName: string;
      input: Record<string, unknown>;
      message: string;
    }
  | { type: "citation"; sources: BffCitation[] }
  | { type: "usage"; promptTokens: number; completionTokens: number }
  | { type: "end"; finishReason: string }
  | { type: "error"; code: string; message: string; traceId?: string };

/** Agent 侧 tool_call 事件反序列化后的最小结构 */
export interface RawToolCall {
  callId: string;
  toolName: string;
  input: Record<string, unknown>;
}

/** 回填给 Agent 的工具结果（snake_case，逐字段对齐 agent ToolResult） */
export interface ToolResultDto {
  call_id: string;
  tool_name: string;
  status: ToolExecutionStatus;
  output?: unknown;
  error?: string;
  duration_ms: number;
}

export interface ToolExecutionContext {
  tenantId: string;
  userId: string;
  username: string;
  roles: string[];
  conversationId: string;
  traceId?: string;
}

export interface ToolExecutorDefinition {
  /** 发给 Agent 的声明（snake_case，逐字段对齐 agent/app/models/tool.py） */
  spec: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    required_permission: string;
    mutating: boolean;
    requires_confirmation: boolean;
  };
  /** 入参校验：防 LLM 编造字段 / 防客户端篡改 */
  inputSchema: ZodType<Record<string, unknown>>;
  run(input: Record<string, unknown>, ctx: ToolExecutionContext): Promise<unknown>;
}

export interface PendingToolCall {
  callId: string;
  toolName: string;
  input: Record<string, unknown>;
  /** 首轮 user 文案：恢复轮次需原样回传（Agent 要求 messages 非空） */
  userMessage: string;
  createdAt: number;
}

/** chat 编排入口参数（由 controller 从请求上下文组装） */
export interface AgentChatInput {
  tenantId: string;
  userId: string;
  username: string;
  roles: string[];
  conversationId: string;
  message?: string;
  confirmedCallIds?: string[];
  dataScope: DataScopeContext;
  traceId?: string;
}

/** 跨库只读的历史行（snake_case，与 Agent 表列名对齐） */
export interface AgentConversationRow {
  conversation_id: string;
  last_at: Date;
  first_at: Date;
  message_count: number;
  summary: string;
}

export interface AgentMessageRow {
  message_id: string;
  conversation_id: string;
  role: string;
  content: string;
  tool_calls: unknown;
  tool_call_id: string | null;
  name: string | null;
  tokens: number;
  created_at: Date;
}
