import { subRedis, redis } from "@/config/redis.js";
import { wsManager } from "@/core/ws/manager.js";
import { prisma } from "@/config/database.js";
import { logger } from "@/core/logger/index.js";
export type NoticePushAction = "push" | "revoke";
const NOTICE_CHANNEL = "notice:push";

export async function publishNoticePush(
  noticeId: string,
  action: NoticePushAction = "push",
): Promise<void> {
  await redis.publish(
    "notice:push",
    JSON.stringify({ noticeId, action, ts: Date.now() }),
  );
}
export async function startNoticeSubscriber() {
  try {
    // 1) 订阅频道（返回值是 number，忽略）
    await subRedis.subscribe(NOTICE_CHANNEL);

    // 2) 监听事件挂在 subRedis 实例上
    subRedis.on("message", (channel: string, message: string) => {
      console.log(channel, message, "收到消息");
      if (channel !== NOTICE_CHANNEL) return;
      try {
        const { noticeId, action } = JSON.parse(message);
        if (!noticeId) return;
        if (action === "revoke") {
          void handleNoticeRevoke(noticeId);
        } else {
          void handleNoticePush(noticeId);
        }
      } catch (err) {
        logger.error({ err, message }, "Failed to parse notice message");
      }
    });

    subRedis.on("error", (err) => {
      logger.error({ err }, "Redis subscriber error");
    });

    logger.info(`Subscribed to Redis channel: ${NOTICE_CHANNEL}`);
  } catch (err) {
    logger.error({ err }, "Failed to subscribe to Redis channel");
  }
}

async function handleNoticePush(noticeId: string) {
  try {
    const notice = await prisma.sys_notice.findUnique({
      where: { notice_id: noticeId },
      include: { target_users: { select: { user_id: true } } },
    });

    if (!notice || notice.status !== "1") return;

    const userIds = notice.target_users.map((tu) => tu.user_id);
    const payload = {
      type: "notice:push",
      data: {
        noticeId: notice.notice_id,
        title: notice.title,
        content: notice.content,
        noticeType: notice.notice_type,
        publishTime: notice.publish_time,
      },
      timestamp: Date.now(),
    };

    wsManager.sendToUsers(userIds, payload);
    logger.info(
      { noticeId, userIds },
      "Notice pushed to local WebSocket clients",
    );
  } catch (err) {
    logger.error({ err, noticeId }, "Failed to handle notice push");
  }
}
/**
 * 推送撤回事件
 * - ⚠️ 不能用 status !== '1' 过滤（撤回后 status 就是 '0'）
 * - ⚠️ 不能用 revoked_at === null 过滤（撤回后它就有值了）
 * - 依赖撤回时保留 sys_notice_user，才能拿到原收件人做定向推送
 */
async function handleNoticeRevoke(noticeId: string) {
  try {
    const notice = await prisma.sys_notice.findUnique({
      where: { notice_id: noticeId },
      include: { target_users: { select: { user_id: true } } },
    });

    if (!notice || notice.status !== "1") return;

    // 从 sys_notice_user 中获取所有收件人
    const userIds = notice!.target_users.map((tu) => tu.user_id);
    const payload = {
      type: "notice:revoke",
      data: { noticeId },
      timestamp: Date.now(),
    };

    if (userIds.length > 0) {
      wsManager.sendToUsers(userIds, payload);
      logger.info(
        { noticeId, count: userIds.length },
        "[notice] revoke delivered",
      );
    } else {
      logger.info({ noticeId }, "[notice] revoke broadcast (no targets)");
    }
  } catch (err) {
    logger.error({ err, noticeId }, "[notice] handleNoticeRevoke failed");
  }
}
