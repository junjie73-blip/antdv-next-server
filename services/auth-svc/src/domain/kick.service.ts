import { redis } from "../config/redis.js";
import { logger } from "../config/logger.js";
import { revokeSession } from "./token.service.js";

const KICKED_KEY_TTL = 7 * 24 * 3600;

/** 踢用户下线（清 session + 标记 + 发布通知） */
export async function kickUser(params: {
  userId: string;
  tenantId: string;
  reason?: string;
  operatorId?: string;
}): Promise<void> {
  const reason = params.reason ?? "您已被管理员强制下线";

  // 1) 扫描并删除所有 session key
  const pattern = `access:${params.tenantId}:${params.userId}:*`;
  const keys: string[] = [];
  let cursor = "0";
  do {
    const [next, batch] = await redis.scan(
      cursor,
      "MATCH",
      pattern,
      "COUNT",
      100,
    );
    cursor = next;
    keys.push(...batch);
  } while (cursor !== "0");

  if (keys.length > 0) {
    // 分批删除
    for (let i = 0; i < keys.length; i += 100) {
      await redis.del(...keys.slice(i, i + 100));
    }
  }

  // 2) 写踢出标记
  await redis.setex(
    `kicked:${params.userId}`,
    KICKED_KEY_TTL,
    JSON.stringify({ reason, at: Date.now() }),
  );

  // 3) 发布广播（供 WS 层消费）
  await redis.publish(
    "user:force-logout",
    JSON.stringify({
      userId: params.userId,
      reason,
      operatorId: params.operatorId,
      at: Date.now(),
    }),
  );

  logger.info(
    { userId: params.userId, tenantId: params.tenantId, sessions: keys.length },
    "[kick] user kicked",
  );

  void revokeSession; // 保留 import（其它调用点用）
}
