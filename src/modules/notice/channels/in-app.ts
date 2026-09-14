import { prisma } from "@/config/database.js";
import { wsManager } from "@/core/ws/manager.js";
import { NoticeChannel, SendContext, SendResult } from "./base.js";

/** 站内信：给 sys_notice_user 里的每个用户推 WS */
export const inAppChannel: NoticeChannel = {
  type: "in_app",
  isReady: () => true,

  async send(ctx: SendContext): Promise<SendResult> {
    if (!ctx.noticeId) {
      return {
        channel: this.type,
        total: 0,
        success: 0,
        failed: 0,
        errors: [],
      };
    }

    const targets = await prisma.sys_notice_user.findMany({
      where: { notice_id: ctx.noticeId, tenant_id: ctx.tenantId },
      select: { user_id: true },
    });
    const userIds = targets.map((t) => t.user_id);
    if (userIds.length === 0) {
      return {
        channel: this.type,
        total: 0,
        success: 0,
        failed: 0,
        errors: [],
      };
    }

    wsManager.sendToUsers(userIds, {
      type: "notice",
      data: { noticeId: ctx.noticeId, title: ctx.title, content: ctx.content },
      timestamp: Date.now(),
    });

    return {
      channel: this.type,
      total: userIds.length,
      success: userIds.length,
      failed: 0,
      errors: [],
    };
  },
};
