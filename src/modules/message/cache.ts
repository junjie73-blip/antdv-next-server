import { redis } from "@/config/redis.js";
import { logger } from "@/platform/logger/index.js";
import { UNREAD_CACHE_TTL } from "./constants.js";

const PREFIX = "message:unread:";

function key(tenantId: string, userId: string, bizType?: string): string {
  return bizType
    ? `${PREFIX}${tenantId}:${userId}:${bizType}`
    : `${PREFIX}${tenantId}:${userId}`;
}

export async function getUnreadCache(
  tenantId: string,
  userId: string,
  bizType?: string,
): Promise<number | null> {
  try {
    const v = await redis.get(key(tenantId, userId, bizType));
    return v === null ? null : Number(v);
  } catch (err) {
    logger.warn({ err }, "[message] unread cache get failed");
    return null;
  }
}

export async function setUnreadCache(
  tenantId: string,
  userId: string,
  count: number,
  bizType?: string,
): Promise<void> {
  try {
    await redis.setex(
      key(tenantId, userId, bizType),
      UNREAD_CACHE_TTL,
      String(count),
    );
  } catch (err) {
    logger.warn({ err }, "[message] unread cache set failed");
  }
}

/** 批量失效（写消息 / 已读 / 删除时调用） */
export async function invalidateUnreadCache(
  tenantId: string,
  userIds: string[],
): Promise<void> {
  if (userIds.length === 0) return;
  try {
    const keys = userIds.flatMap((uid) => [
      key(tenantId, uid),
      // 各 biz_type 的 key 一并清除（数量有限，可枚举）
      ...["notice", "todo", "workflow", "system", "announcement"].map((t) =>
        key(tenantId, uid, t),
      ),
    ]);
    if (keys.length > 0) await redis.del(...keys);
  } catch (err) {
    logger.warn({ err }, "[message] unread cache invalidate failed");
  }
}
