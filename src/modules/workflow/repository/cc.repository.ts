import { prisma } from "@/config/database.js";
import { AppError } from "@/core/errors.js";

export interface CcRecord {
  cc_id: string;
  tenant_id: string;
  instance_id: string;
  task_id: string | null;
  node_id: string;
  node_name: string;
  receiver_id: string;
  is_read: number;
  read_at: Date | null;
  title: string | null;
  content: string | null;
  created_at: Date;
}

export interface CcListQuery {
  pageNum?: number;
  pageSize?: number;
  isRead?: number;
  keyword?: string;
}

export class CcRepository {
  /* ============================================================
   * 批量写入（节点执行时调用）
   * ============================================================ */
  async batchCreate(
    rows: Array<{
      tenantId: string;
      instanceId: string;
      taskId?: string | null;
      nodeId: string;
      nodeName: string;
      receiverId: string;
      title?: string | null;
      content?: string | null;
    }>,
  ): Promise<number> {
    if (rows.length === 0) return 0;
    const r = await prisma.wf_cc_record.createMany({
      data: rows.map((row) => ({
        tenant_id: row.tenantId,
        instance_id: row.instanceId,
        task_id: row.taskId ?? null,
        node_id: row.nodeId,
        node_name: row.nodeName,
        receiver_id: row.receiverId,
        title: row.title ?? null,
        content: row.content ?? null,
        is_read: 0,
      })),
      skipDuplicates: true,
    });
    return r.count;
  }

  /* ============================================================
   * 用户抄送列表
   * ============================================================ */
  async findMyPage(
    userId: string,
    tenantId: string,
    query: CcListQuery,
  ): Promise<{
    list: CcRecord[];
    total: number;
    pageNum: number;
    pageSize: number;
    totalPages: number;
  }> {
    const pageNum = Math.max(1, query.pageNum || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 20));
    const skip = (pageNum - 1) * pageSize;

    const where: any = {
      tenant_id: tenantId,
      receiver_id: userId,
    };
    if (query.isRead !== undefined) where.is_read = query.isRead;
    if (query.keyword) {
      where.OR = [
        { title: { contains: query.keyword } },
        { node_name: { contains: query.keyword } },
      ];
    }

    const [list, total] = await Promise.all([
      prisma.wf_cc_record.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { created_at: "desc" },
      }),
      prisma.wf_cc_record.count({ where }),
    ]);

    return {
      list: list as CcRecord[],
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /* ============================================================
   * 未读数
   * ============================================================ */
  async countUnread(userId: string, tenantId: string): Promise<number> {
    return prisma.wf_cc_record.count({
      where: { tenant_id: tenantId, receiver_id: userId, is_read: 0 },
    });
  }

  /* ============================================================
   * 标记已读
   * ============================================================ */
  async markRead(
    ccId: string,
    userId: string,
    tenantId: string,
  ): Promise<number> {
    const r = await prisma.wf_cc_record.updateMany({
      where: {
        cc_id: ccId,
        tenant_id: tenantId,
        receiver_id: userId,
        is_read: 0,
      },
      data: { is_read: 1, read_at: new Date() },
    });
    return r.count;
  }

  async markReadBatch(
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

  /* ============================================================
   * 归属校验
   * ============================================================ */
  async assertOwnership(
    ccIds: string[],
    userId: string,
    tenantId: string,
  ): Promise<void> {
    if (ccIds.length === 0) return;
    const unique = [...new Set(ccIds)];
    const count = await prisma.wf_cc_record.count({
      where: {
        cc_id: { in: unique },
        tenant_id: tenantId,
        receiver_id: userId,
      },
    });
    if (count !== unique.length) {
      throw new AppError("存在无效的抄送记录 ID", 400001, 400);
    }
  }

  /* ============================================================
   * 按实例查（详情用）
   * ============================================================ */
  async findByInstance(
    instanceId: string,
    tenantId: string,
  ): Promise<CcRecord[]> {
    return prisma.wf_cc_record.findMany({
      where: { instance_id: instanceId, tenant_id: tenantId },
      orderBy: { created_at: "asc" },
    }) as unknown as Promise<CcRecord[]>;
  }

  /* ============================================================
   * 清理（定时任务）
   * ============================================================ */
  async purgeBefore(before: Date, limit = 1000): Promise<number> {
    const rows = await prisma.wf_cc_record.findMany({
      where: { created_at: { lt: before } },
      select: { cc_id: true },
      take: limit,
    });
    if (rows.length === 0) return 0;
    const r = await prisma.wf_cc_record.deleteMany({
      where: { cc_id: { in: rows.map((x) => x.cc_id) } },
    });
    return r.count;
  }
}
