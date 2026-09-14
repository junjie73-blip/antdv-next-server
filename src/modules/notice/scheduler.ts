import cron from "node-cron";
import { prisma } from "@/config/database.js";
import { logger } from "@/core/logger/index.js";
import { withLock } from "@/core/scheduler/lock.js";
import { pushNotice } from "./pusher.js";

export function startNoticeScheduler() {
  cron.schedule("*/30 * * * * *", async () => {
    const result = await withLock("job:lock:notice-publish", 25, async () => {
      const dueNotices = await prisma.sys_notice.findMany({
        where: {
          status: "0",
          is_deleted: 0,
          publish_time: { lte: new Date() },
        },
        select: { notice_id: true, tenant_id: true },
      });

      if (dueNotices.length === 0) return 0;

      const ids = dueNotices.map((n) => n.notice_id);
      await prisma.sys_notice.updateMany({
        where: { notice_id: { in: ids } },
        data: { status: "1" },
      });

      await Promise.all(
        dueNotices.map((n) => pushNotice(n.notice_id, n.tenant_id)),
      );
      return ids.length;
    });

    if (result !== null) {
      logger.info({ count: result }, "Published scheduled notices");
    }
  });
}
