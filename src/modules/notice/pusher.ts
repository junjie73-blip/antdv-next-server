import { wsManager } from "@/core/ws/manager.js";
import { prisma } from "@/config/database.js";
import { logger } from "@/core/logger/index.js";
import { publishNoticePush } from "@/core/redis/pubsub.js";
import { dispatchNotice } from "./channels/index.js";

/**
 * 通知发布后推送 WebSocket 消息
 * @param noticeId 通知ID
 */
export async function pushNotice(noticeId: string) {
  try {
    const { prisma } = await import("@/config/database.js");
    const notice = await prisma.sys_notice.findUnique({
      where: { notice_id: noticeId },
      select: {
        notice_id: true,
        tenant_id: true,
        title: true,
        content: true,
        status: true,
        notice_type: true,
        publish_time: true,
      },
    });
    if (!notice || notice.status !== "1") return;

    await dispatchNotice({
      tenantId: notice.tenant_id,
      noticeId: notice.notice_id,
      title: notice.title,
      content: notice.content ?? undefined,
    });
  } catch (err) {
    logger.error({ err, noticeId }, "[pusher] pushNotice failed");
  }
}
