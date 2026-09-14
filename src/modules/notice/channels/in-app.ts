import { prisma } from "@/config/database.js";
import { publishNoticePush } from "@/core/redis/pubsub.js";
import { NoticeChannel, SendContext, SendResult } from "./base.js";

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

    // ⭐ 改为走 Redis pub/sub
    await publishNoticePush(ctx.noticeId);

    const count = await prisma.sys_notice_user.count({
      where: { notice_id: ctx.noticeId, tenant_id: ctx.tenantId },
    });

    return {
      channel: this.type,
      total: count,
      success: count,
      failed: 0,
      errors: [],
    };
  },
};
