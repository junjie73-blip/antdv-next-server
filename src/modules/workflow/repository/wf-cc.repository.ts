import { prisma } from "@/config/database.js";

export class WfCcRepository {
  async findMyPage(
    userId: string,
    tenantId: string,
    query: { pageNum: number; pageSize: number; isRead?: number },
  ) {
    const { pageNum, pageSize, isRead } = query;
    const where: any = { tenant_id: tenantId, receiver_id: userId };
    if (isRead !== undefined) where.is_read = isRead;

    const [list, total] = await Promise.all([
      prisma.wf_cc_record.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      prisma.wf_cc_record.count({ where }),
    ]);
    return {
      list,
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async unreadCount(userId: string, tenantId: string): Promise<number> {
    return prisma.wf_cc_record.count({
      where: { tenant_id: tenantId, receiver_id: userId, is_read: 0 },
    });
  }

  async markRead(
    ccIds: string[],
    userId: string,
    tenantId: string,
  ): Promise<number> {
    if (ccIds.length === 0) return 0;
    const r = await prisma.wf_cc_record.updateMany({
      where: {
        cc_id: { in: ccIds },
        tenant_id: tenantId,
        receiver_id: userId,
        is_read: 0,
      },
      data: { is_read: 1, read_at: new Date() },
    });
    return r.count;
  }

  async markAllRead(userId: string, tenantId: string): Promise<number> {
    const r = await prisma.wf_cc_record.updateMany({
      where: { tenant_id: tenantId, receiver_id: userId, is_read: 0 },
      data: { is_read: 1, read_at: new Date() },
    });
    return r.count;
  }
}
