import { subRedis, redis, scanAll } from "@/config/redis.js";
import { wsManager } from "@/core/ws/manager.js";
import { logger } from "@/core/logger/index.js";

const FORCE_LOGOUT_CHANNEL = "user:force-logout";

/** 踢下线原因，前端展示用 */
export interface ForceLogoutPayload {
  userId: string;
  reason?: string;
  /** 操作人，审计用 */
  operatorId?: string;
  /** 触发时间 */
  at?: number;
}

/**
 * 管理员踢人时调用：
 *   - 清 session
 *   - 打黑名单标记（可选）
 *   - 通过 Redis 广播，让持有该用户 WS 连接的进程把消息推下去
 */
export async function kickUser(
  userId: string,
  options: { reason?: string; operatorId?: string } = {},
): Promise<void> {
  const { reason = "您已被管理员强制下线", operatorId } = options;

  // 1. 清掉该用户所有 session
  const sessionKeys = await scanAll(`session:${userId}:*`);
  if (sessionKeys.length) {
    await redis.del(...sessionKeys);
    logger.info(
      { userId, count: sessionKeys.length },
      "[kick] sessions cleared",
    );
  }

  // 2. 打踢下线标记，兜底：即使 WS 断了，下次请求也能感知
  //    TTL 给足（比如 7 天），用户重新登录时清掉
  await redis.setex(
    `kicked:${userId}`,
    7 * 24 * 3600,
    JSON.stringify({ reason, at: Date.now() }),
  );

  // 3. 广播
  const payload: ForceLogoutPayload = {
    userId,
    reason,
    operatorId,
    at: Date.now(),
  };
  await redis.publish(FORCE_LOGOUT_CHANNEL, JSON.stringify(payload));
  logger.info({ userId, operatorId }, "[kick] force-logout published");
}

/** 用户重新登录时调用，清掉踢下线标记 */
export async function clearKickedFlag(userId: string): Promise<void> {
  await redis.del(`kicked:${userId}`);
}

/** 查询用户是否处于"已被踢"状态（auth 中间件用） */
export async function getKickedFlag(
  userId: string,
): Promise<{ reason: string; at: number } | null> {
  const raw = await redis.get(`kicked:${userId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return { reason: "您已被强制下线", at: Date.now() };
  }
}

/** 订阅频道，收到消息后通过 wsManager 推给本进程持有的连接 */
export async function startForceLogoutSubscriber() {
  try {
    const subscriber = (await subRedis.subscribe(FORCE_LOGOUT_CHANNEL)) as any;

    subscriber.on("message", (channel: string, message: any) => {
      if (channel !== FORCE_LOGOUT_CHANNEL) return;
      try {
        const raw =
          typeof message === "string" ? message : JSON.stringify(message);
        const data = JSON.parse(raw) as ForceLogoutPayload;

        wsManager.sendToUsers([data.userId], {
          type: "force-logout",
          data: { reason: data.reason, at: data.at },
          timestamp: Date.now(),
        });

        logger.info({ userId: data.userId }, "[kick] pushed to WS");
      } catch (err) {
        logger.error({ err, message }, "Failed to handle force-logout message");
      }
    });

    subscriber.on("error", (err: any) => {
      logger.error({ err }, "Force-logout subscriber error");
    });

    logger.info(`Subscribed to Redis channel: ${FORCE_LOGOUT_CHANNEL}`);
  } catch (err) {
    logger.error({ err }, "Failed to subscribe to force-logout channel");
  }
}
