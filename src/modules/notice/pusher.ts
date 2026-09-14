import { prisma } from "@/config/database.js";
import { logger } from "@/core/logger/index.js";
import { dispatchNotice } from "./channels/index.js";

export async function pushNotice(
  noticeId: string,
  tenantId?: string,
): Promise<void> {
  try {
    const notice = await prisma.sys_notice.findFirst({
      where: {
        notice_id: noticeId,
        ...(tenantId ? { tenant_id: tenantId } : {}),
        is_deleted: 0,
      },
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
