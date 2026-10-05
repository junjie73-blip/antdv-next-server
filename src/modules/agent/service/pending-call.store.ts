import { redis } from "@/config/redis.js";
import { env } from "@/config/env.js";
import { logger } from "@/platform/logger/index.js";
import { pendingCallKey } from "../constants.js";
import type { PendingToolCall } from "../types.js";

/**
 * 待确认工具调用的 Redis 暂存。
 * `take` 是一次性消费（取到即删），防止同一个 callId 被重放执行。
 */
export class PendingCallStore {
  async save(
    tenantId: string,
    conversationId: string,
    call: PendingToolCall,
  ): Promise<void> {
    const ttl = Number(env.AGENT_PENDING_TTL_SECONDS) || 600;
    await redis.set(
      pendingCallKey(tenantId, conversationId, call.callId),
      JSON.stringify(call),
      "EX",
      ttl,
    );
  }

  async take(
    tenantId: string,
    conversationId: string,
    callId: string,
  ): Promise<PendingToolCall | null> {
    if (!tenantId || !conversationId || !callId) return null;
    const key = pendingCallKey(tenantId, conversationId, callId);
    try {
      const raw = await redis.get(key);
      if (!raw) return null;
      // 取到即删：确认续跑只允许成功一次
      await redis.del(key);
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      const call = parsed as PendingToolCall;
      if (call.callId !== callId || typeof call.toolName !== "string") return null;
      return call;
    } catch (err) {
      logger.warn({ err, conversationId, callId }, "[agent] 待确认调用读取失败");
      return null;
    }
  }
}

export const pendingCallStore = new PendingCallStore();
