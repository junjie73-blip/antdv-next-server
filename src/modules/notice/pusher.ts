import { wsManager } from "@/core/ws/manager.js";
import { prisma } from "@/config/database.js";
import { logger } from "@/core/logger/index.js";
import { publishNoticePush } from "@/core/redis/pubsub.js";

/**
 * 通知发布后推送 WebSocket 消息
 * @param noticeId 通知ID
 */
export async function pushNotice(noticeId: string) {
  try {
    const notice = await prisma.sys_notice.findUnique({
      where: { notice_id: noticeId },
      include: {
        target_users: {
          select: { user_id: true },
        },
      },
    });

    if (!notice || notice.status !== "1") return;

    const targetUserIds = notice.target_users.map((tu) => tu.user_id);
    if (targetUserIds.length === 0) return; // 如果没有指定用户，则不发（或按业务规则处理）

    const message = {
      type: "notice",
      data: {
        noticeId: notice.notice_id,
        title: notice.title,
        content: notice.content,
        noticeType: notice.notice_type,
        publishTime: notice.publish_time,
      },
    };

    // 精确推送
    wsManager.sendToUsers(targetUserIds, message);
  } catch (error) {
    console.error("Failed to push notice:", error);
  }
}
