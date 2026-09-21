import { prisma } from "@/config/database.js";
import { NoticeChannel, SendContext, SendResult } from "./base.js";
import { publishNoticePush } from "@/platform/ws/index.js";

/** 站内信：通过 Redis pub/sub 广播，各实例推自己的连接 */
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

    // ⭐ 通过 Redis pub/sub 广播（多实例安全）
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
