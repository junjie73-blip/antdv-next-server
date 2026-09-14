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
    // 1) 订阅频道（返回值是 number，忽略）
    await subRedis.subscribe(NOTICE_CHANNEL);

    // 2) 监听事件挂在 subRedis 实例上
    subRedis.on("message", (channel: string, message: string) => {
      if (channel !== NOTICE_CHANNEL) return;
      try {
        const { noticeId } = JSON.parse(message);
        if (!noticeId) return;
        void handleNoticePush(noticeId);
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
    logger.error({ err, noticeId }, "Failed to handle notice push");
  }
}
