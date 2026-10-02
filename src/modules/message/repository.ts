import { BaseRepository } from "@/core/base/repository.js";
import { prisma } from "@/config/database.js";
import { AppError } from "@/core/errors.js";
import type {
  MessageEntity,
  MyMessageQuery,
  PushMessageParams,
} from "./types.js";

export class MessageRepository extends BaseRepository<
  MessageEntity,
  any,
  any,
  any
> {
  protected readonly model = prisma.sys_message;
  protected readonly primaryKey = "message_id";

  /* ============================================================
   * 分页查询（用户侧）
   * ============================================================ */
  async findMyPage(
    userId: string,
    tenantId: string,
    query: MyMessageQuery,
  ): Promise<{
    list: MessageEntity[];
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
      user_id: userId,
      is_deleted: 0,
      // 过期消息不展示
      OR: [{ expire_at: null }, { expire_at: { gt: new Date() } }],
    };

    if (query.isRead !== undefined) where.is_read = query.isRead;
    if (query.bizType) where.biz_type = query.bizType;
    if (query.keyword) {
      where.AND = [
        {
          OR: [
            { title: { contains: query.keyword } },
            { content: { contains: query.keyword } },
          ],
        },
      ];
    }

    const [list, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ is_top: "desc" }, { created_at: "desc" }],
      }),
      this.model.count({ where }),
    ]);

    return {
      list: list as MessageEntity[],
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /* ============================================================
   * 未读数（按类型汇总）
   * ============================================================ */
  async countUnread(
    userId: string,
    tenantId: string,
    bizType?: string,
  ): Promise<number> {
    return this.model.count({
      where: {
        tenant_id: tenantId,
        user_id: userId,
        is_deleted: 0,
        is_read: 0,
        ...(bizType ? { biz_type: bizType } : {}),
        OR: [{ expire_at: null }, { expire_at: { gt: new Date() } }],
      },
    });
  }

  async countUnreadGroupByType(
    userId: string,
    tenantId: string,
  ): Promise<Array<{ biz_type: string; count: number }>> {
    const rows = await this.model.groupBy({
      by: ["biz_type"],
      where: {
        tenant_id: tenantId,
        user_id: userId,
        is_deleted: 0,
        is_read: 0,
        OR: [{ expire_at: null }, { expire_at: { gt: new Date() } }],
      },
      _count: { message_id: true },
    });
    return rows.map((r: any) => ({
      biz_type: r.biz_type,
      count: r._count.message_id,
    }));
  }

  /* ============================================================
   * 标记已读
   * ============================================================ */
  async markRead(
    messageId: string,
    userId: string,
    tenantId: string,
  ): Promise<number> {
    const r = await this.model.updateMany({
      where: {
        message_id: messageId,
        tenant_id: tenantId,
        user_id: userId,
        is_deleted: 0,
        is_read: 0,
      },
      data: { is_read: 1, read_at: new Date() },
    });
    return r.count;
  }

  async markReadBatch(
    messageIds: string[],
    userId: string,
    tenantId: string,
  ): Promise<number> {
    if (messageIds.length === 0) return 0;
    const r = await this.model.updateMany({
      where: {
        message_id: { in: messageIds },
        tenant_id: tenantId,
        user_id: userId,
        is_deleted: 0,
        is_read: 0,
      },
      data: { is_read: 1, read_at: new Date() },
    });
    return r.count;
  }

  async markAllRead(
    userId: string,
    tenantId: string,
    bizType?: string,
  ): Promise<number> {
    const r = await this.model.updateMany({
      where: {
        tenant_id: tenantId,
        user_id: userId,
        is_deleted: 0,
        is_read: 0,
        ...(bizType ? { biz_type: bizType } : {}),
      },
      data: { is_read: 1, read_at: new Date() },
    });
    return r.count;
  }

  /* ============================================================
   * 删除
   * ============================================================ */
  async softDeleteOne(
    messageId: string,
    userId: string,
    tenantId: string,
  ): Promise<number> {
    const r = await this.model.updateMany({
      where: {
        message_id: messageId,
        tenant_id: tenantId,
        user_id: userId,
        is_deleted: 0,
      },
      data: { is_deleted: 1 },
    });
    return r.count;
  }

  async softDeleteBatch(
    messageIds: string[],
    userId: string,
    tenantId: string,
  ): Promise<number> {
    if (messageIds.length === 0) return 0;
    const r = await this.model.updateMany({
      where: {
        message_id: { in: messageIds },
        tenant_id: tenantId,
        user_id: userId,
        is_deleted: 0,
      },
      data: { is_deleted: 1 },
    });
    return r.count;
  }

  /** 清空已读（未读保留） */
  async clearRead(userId: string, tenantId: string): Promise<number> {
    const r = await this.model.updateMany({
      where: {
        tenant_id: tenantId,
        user_id: userId,
        is_deleted: 0,
        is_read: 1,
      },
      data: { is_deleted: 1 },
    });
    return r.count;
  }

  /* ============================================================
   * 写入（供内部推送）
   * ============================================================ */
  async batchInsert(
    rows: Array<
      Omit<PushMessageParams, "userIds" | "realtime"> & {
        userId: string;
      }
    >,
  ): Promise<number> {
    if (rows.length === 0) return 0;
    const r = await this.model.createMany({
      data: rows.map((row) => ({
        tenant_id: row.tenantId,
        user_id: row.userId,
        biz_type: row.bizType,
        biz_id: row.bizId ?? null,
        title: row.title,
        content: row.content ?? null,
        priority: row.priority ?? 0,
        is_top: row.isTop ?? 0,
        expire_at: row.expireAt ?? null,
        is_read: 0,
        is_deleted: 0,
      })),
      skipDuplicates: true,
    });
    return r.count;
  }

  /* ============================================================
   * 校验归属（防止越权）
   * ============================================================ */
  async assertOwnership(
    messageIds: string[],
    userId: string,
    tenantId: string,
  ): Promise<void> {
    if (messageIds.length === 0) return;
    const uniqueIds = [...new Set(messageIds)];
    const count = await this.model.count({
      where: {
        message_id: { in: uniqueIds },
        tenant_id: tenantId,
        user_id: userId,
      },
    });
    if (count !== uniqueIds.length) {
      throw new AppError("存在无效的消息 ID", 400001, 400);
    }
  }

  /* ============================================================
   * 定时清理（过期/软删除）
   * ============================================================ */
  async purgeExpired(before: Date, limit = 1000): Promise<number> {
    const rows = await this.model.findMany({
      where: {
        OR: [
          { expire_at: { lt: before } },
          { is_deleted: 1, updated_at: { lt: before } },
        ],
      },
      select: { message_id: true },
      take: limit,
    });
    if (rows.length === 0) return 0;
    const r = await this.model.deleteMany({
      where: { message_id: { in: rows.map((x) => x.message_id) } },
    });
    return r.count;
  }
}
