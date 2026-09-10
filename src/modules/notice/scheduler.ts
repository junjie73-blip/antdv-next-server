import cron from "node-cron";
import { prisma } from "@/config/database.js";
import { logger } from "@/core/logger/index.js";
import { pushNotice } from "./pusher.js";

/**
 * 定时检查并发布到期通知
 * 每分钟执行一次，查找 status=0 且 publish_time <= now 的通知
 */
export function startNoticeScheduler() {
  // 每 30 秒检查一次（可根据需要调整）
  cron.schedule("*/30 * * * * *", async () => {
    try {
      const now = new Date();
      const dueNotices = await prisma.sys_notice.findMany({
        where: {
          status: "0", // 草稿
          is_deleted: 0,
          publish_time: { lte: now },
        },
        select: { notice_id: true, tenant_id: true },
      });

      if (dueNotices.length === 0) return;

      // 批量更新为已发布
      const ids = dueNotices.map((n) => n.notice_id);
      await prisma.sys_notice.updateMany({
        where: { notice_id: { in: ids } },
        data: { status: "1" },
      });
      // 在更新状态为已发布后，对每个通知推送
      await prisma.sys_notice.updateMany({
        where: { notice_id: { in: ids } },
        data: { status: "1" },
      });

      // 推送 WebSocket 通知
      dueNotices.forEach((n) => pushNotice(n.notice_id));
      // 此处可以触发实际发送逻辑（WebSocket推送、邮件等）
      logger.info(
        { noticeIds: ids },
        `Published ${ids.length} scheduled notices`,
      );
    } catch (error) {
      logger.error({ error }, "Error in notice scheduler");
    }
  });
}
