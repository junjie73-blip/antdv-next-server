// platform/ws/notice-pubsub.ts
import { redis } from "@/config/redis.js";
import { logger } from "@/platform/logger/index.js";

/**
 * 通知推送频道
 * - 单频道多动作
 * - payload 携带 receiverIds 可选白名单
 */
const CHANNEL = "notice:push";

/** 动作类型 */
export type NoticePushAction = "create" | "revoke";

/** 广播载荷 */
export interface NoticePushPayload {
  noticeId: string;
  action: NoticePushAction;
  /**
   * 接收人白名单
   * - undefined / 空数组 → 广播给所有在线用户
   * - 非空 → 只推给这些用户
   */
  receiverIds?: string[];
}

/* ============================================================
 * 发布
 * ============================================================ */
export async function publishNoticePush(
  noticeId: string,
  action?: NoticePushAction,
  receiverIds?: string[],
): Promise<void>;
export async function publishNoticePush(
  payload: NoticePushPayload,
): Promise<void>;
export async function publishNoticePush(
  noticeIdOrPayload: string | NoticePushPayload,
  action: NoticePushAction = "create",
  receiverIds?: string[],
): Promise<void> {
  try {
    const payload: NoticePushPayload =
      typeof noticeIdOrPayload === "string"
        ? {
            noticeId: noticeIdOrPayload,
            action,
            ...(receiverIds && receiverIds.length > 0
              ? { receiverIds: [...new Set(receiverIds)] }
              : {}),
          }
        : {
            ...noticeIdOrPayload,
            ...(noticeIdOrPayload.receiverIds &&
            noticeIdOrPayload.receiverIds.length > 0
              ? { receiverIds: [...new Set(noticeIdOrPayload.receiverIds)] }
              : {}),
          };

    if (!payload.noticeId) {
      logger.warn({ payload }, "[notice-pubsub] missing noticeId, skip");
      return;
    }

    await redis.publish(CHANNEL, JSON.stringify(payload));

    logger.debug(
      {
        noticeId: payload.noticeId,
        action: payload.action,
        receiverCount: payload.receiverIds?.length ?? 0,
      },
      "[notice-pubsub] published",
    );
  } catch (err) {
    logger.error(
      {
        err,
        noticeId:
          typeof noticeIdOrPayload === "string"
            ? noticeIdOrPayload
            : noticeIdOrPayload.noticeId,
        action,
      },
      "[notice-pubsub] publish failed",
    );
  }
}

/* ============================================================
 * 订阅（供 platform/ws/index.ts 使用）
 * ============================================================ */
type NoticePushHandler = (payload: NoticePushPayload) => void;

let noticeSubscribed = false;

/**
 * 订阅 notice:push 频道
 * - 幂等：重复调用安全
 * - 由 bootstrap 在启动时调用一次
 * - 收到的消息交给 handler 分发（handler 里调用 wsManager）
 */
export async function startNoticePushSubscriber(
  handler: NoticePushHandler,
): Promise<void> {
  if (noticeSubscribed) {
    logger.debug("[notice-pubsub] subscriber already started, skip");
    return;
  }
  noticeSubscribed = true;

  // ⚠️ 订阅连接必须用 subRedis
  const { subRedis } = await import("@/config/redis.js");

  void subRedis.subscribe(CHANNEL);

  subRedis.on("message", (channel: string, message: string) => {
    if (channel !== CHANNEL) return;

    try {
      const payload = JSON.parse(message) as NoticePushPayload;

      if (!payload?.noticeId || !payload?.action) {
        logger.warn({ message }, "[notice-pubsub] invalid payload");
        return;
      }

      handler(payload);
    } catch (err) {
      logger.warn(
        { err, message: message.slice(0, 200) },
        "[notice-pubsub] parse failed",
      );
    }
  });

  subRedis.on("error", (err: Error) => {
    logger.error({ err }, "[notice-pubsub] subRedis error");
  });

  logger.info({ channel: CHANNEL }, "[notice-pubsub] subscriber started");
}

/** 供测试使用：重置状态 */
export function resetNoticePushSubscriber(): void {
  noticeSubscribed = false;
}

export { CHANNEL as NOTICE_PUSH_CHANNEL };
