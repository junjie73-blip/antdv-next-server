import { prisma } from "@/config/database.js";

export class NoticePreferenceRepository {
  async listByUser(userId: string, tenantId: string) {
    return prisma.sys_user_notice_preference.findMany({
      where: { user_id: userId, tenant_id: tenantId },
    });
  }

  /** 批量 UPSERT */
  async batchUpsert(
    userId: string,
    tenantId: string,
    items: Array<{ channel: string; eventType: string; enabled: number }>,
  ): Promise<void> {
    if (items.length === 0) return;
    await prisma.$transaction(
      items.map((it) =>
        prisma.sys_user_notice_preference.upsert({
          where: {
            user_id_channel_event_type: {
              user_id: userId,
              channel: it.channel,
              event_type: it.eventType,
            },
          },
          update: { enabled: it.enabled, updated_at: new Date() },
          create: {
            tenant_id: tenantId,
            user_id: userId,
            channel: it.channel,
            event_type: it.eventType,
            enabled: it.enabled,
          },
        }),
      ),
    );
  }

  async deleteByUser(userId: string, tenantId: string, channel?: string) {
    await prisma.sys_user_notice_preference.deleteMany({
      where: {
        user_id: userId,
        tenant_id: tenantId,
        ...(channel ? { channel } : {}),
      },
    });
  }

  /**
   * 判断是否允许发送
   * 优先精确匹配 (channel + event)，其次 (channel + "*")
   */
  async findAllowed(
    userIds: string[],
    tenantId: string,
    channel: string,
    eventType: string,
  ): Promise<string[]> {
    if (userIds.length === 0) return [];

    const rows = await prisma.sys_user_notice_preference.findMany({
      where: {
        user_id: { in: userIds },
        tenant_id: tenantId,
        channel,
        event_type: { in: [eventType, "*"] },
      },
    });

    // userId → (enabled, specificity)
    const decisions = new Map<string, { enabled: number; priority: number }>();
    for (const r of rows) {
      const priority = r.event_type === eventType ? 2 : 1;
      const cur = decisions.get(r.user_id);
      if (!cur || priority > cur.priority) {
        decisions.set(r.user_id, { enabled: r.enabled, priority });
      }
    }

    // 返回 enabled = 1 的用户
    return userIds.filter((uid) => decisions.get(uid)?.enabled === 1);
  }
}
