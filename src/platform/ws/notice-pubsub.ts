import { subRedis, redis } from "@/config/redis.js";
import { wsManager } from "./manager.js";
import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";

export type NoticePushAction = "push" | "revoke";
const NOTICE_CHANNEL = "notice:push";

export async function publishNoticePush(
  noticeId: string,
  action: NoticePushAction = "push",
): Promise<void> {
  await redis.publish(
    NOTICE_CHANNEL,
    JSON.stringify({ noticeId, action, ts: Date.now() }),
  );
}

export async function startNoticeSubscriber(): Promise<void> {
  try {
    await subRedis.subscribe(NOTICE_CHANNEL);

    subRedis.on("message", (channel: string, message: string) => {
      if (channel !== NOTICE_CHANNEL) return;
      try {
        const { noticeId, action } = JSON.parse(message);
        if (!noticeId) return;
        if (action === "revoke") void handleNoticeRevoke(noticeId);
        else void handleNoticePush(noticeId);
      } catch (err) {
        logger.error({ err, message }, "Failed to parse notice message");
      }
    });

    subRedis.on("error", (err) =>
      logger.error({ err }, "Redis subscriber error"),
    );

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
    logger.info({ noticeId, userIds }, "[notice] pushed");
  } catch (err) {
    logger.error({ err, noticeId }, "Failed to handle notice push");
  }
}

/**
 * ⭐ 撤回：不能过滤 status（撤回后 status='0'）
 * 依赖 sys_notice_user 保留原收件人做定向推送
 */
async function handleNoticeRevoke(noticeId: string) {
  try {
    const notice = await prisma.sys_notice.findUnique({
      where: { notice_id: noticeId },
      include: { target_users: { select: { user_id: true } } },
    });

    if (!notice) return;

    const userIds = notice.target_users.map((tu) => tu.user_id);
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
