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
    // 查询通知详情及目标用户
    const notice = await prisma.sys_notice.findUnique({
      where: { notice_id: noticeId },
      include: {
        target_users: { select: { user_id: true } },
      },
    });

    if (!notice || notice.status !== 1) return; // 只推送已发布的通知

    const targetUserIds = notice.target_users.map((tu) => tu.user_id);
    if (targetUserIds.length === 0) return;

    const message = {
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
    await publishNoticePush(noticeId);

    wsManager.sendToUsers(notice.tenant_id, targetUserIds, message);
    logger.info(
      { noticeId, targetUserCount: targetUserIds.length },
      "Notice pushed via WebSocket",
    );
  } catch (error) {
    logger.error({ error, noticeId }, "Failed to push notice");
  }
}
