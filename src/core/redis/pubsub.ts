import { subRedis, redis } from "@/config/redis.js";
import { wsManager } from "@/core/ws/manager.js";
import { prisma } from "@/config/database.js";
import { logger } from "@/core/logger/index.js";

const NOTICE_CHANNEL = "notice:push";

export async function publishNoticePush(noticeId: string) {
  await redis.publish(NOTICE_CHANNEL, JSON.stringify({ noticeId }));
}

export async function startNoticeSubscriber() {
  try {
    const subscriber = await subRedis.subscribe(NOTICE_CHANNEL);

    // 使用 any 类型接收消息，避免类型不匹配
    subscriber.on("message", (message: any) => {
      try {
        // 兼容不同的消息格式：可能是字符串，也可能是对象
        const raw =
          typeof message === "string" ? message : JSON.stringify(message);
        const { noticeId } = JSON.parse(raw);
        handleNoticePush(noticeId);
      } catch (err) {
        logger.error({ err, message }, "Failed to handle Redis notice message");
      }
    });

    subscriber.on("error", (err: any) => {
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
      type: "notice",
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
    logger.error({ err, noticeId }, "Failed to handle notice push from Redis");
  }
}
