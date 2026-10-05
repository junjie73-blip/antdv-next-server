/** Agent（Python 服务）业务接口前缀；健康与指标在根路径，无此前缀 */
export const AGENT_API_PREFIX = "/v1";

export const AGENT_HEADER_TOKEN = "x-internal-token";
export const AGENT_HEADER_TIMESTAMP = "x-timestamp";
export const AGENT_HEADER_TRACE = "x-trace-id";

/** SSE 心跳帧：以 `:` 开头的注释行，解析方会忽略 */
export const SSE_HEARTBEAT_FRAME = ": ping\n\n";

/** 单帧 data 上限，防上游异常撑爆内存 */
export const SSE_MAX_FRAME_BYTES = 256 * 1024;

/** 工具结果序列化上限，超出截断并附 truncated 标记 */
export const TOOL_OUTPUT_MAX_BYTES = 64 * 1024;

/** Redis 待确认调用 key；前缀 `agent:` 已登记进 CACHE_GROUPS */
export const pendingCallKey = (
  tenantId: string,
  conversationId: string,
  callId: string,
): string => `agent:pending:${tenantId}:${conversationId}:${callId}`;

/** Agent 事件名 → BFF 事件名；未知事件直接丢弃（不向下游泄漏 Agent 内部契约） */
export const AGENT_EVENT_TO_BFF = {
  start: "start",
  token: "delta",
  tool_call: "toolCall",
  confirm_required: "confirmRequired",
  citation: "citation",
  usage: "usage",
  end: "end",
  error: "error",
} as const;

/** BFF 语义化错误码（仅用于 SSE error 帧，非 HTTP 错误码） */
export const AGENT_ERROR_CODES = {
  IDLE_TIMEOUT: "AGENT_IDLE_TIMEOUT",
  TOOL_LOOP_EXCEEDED: "AGENT_TOOL_LOOP_EXCEEDED",
  PENDING_EXPIRED: "AGENT_PENDING_EXPIRED",
  STREAM_FAILED: "AGENT_STREAM_FAILED",
} as const;
