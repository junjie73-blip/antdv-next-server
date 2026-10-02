import { BaseService } from "@/core/base/service.js";
import { MessageRepository } from "../repository.js";
import {
  getUnreadCache,
  setUnreadCache,
  invalidateUnreadCache,
} from "../cache.js";
import { AppError } from "@/core/errors.js";
import type { MyMessageQuery, UnreadSummary } from "../types.js";
import { BATCH_READ_MAX, BATCH_DELETE_MAX } from "../constants.js";

export class MessageService extends BaseService<MessageRepository> {
  constructor(repo: MessageRepository) {
    super(repo);
  }

  /* ============================================================
   * 列表
   * ============================================================ */
  async listMine(userId: string, tenantId: string, query: MyMessageQuery) {
    return this.repository.findMyPage(userId, tenantId, query);
  }

  /* ============================================================
   * 未读数
   * ============================================================ */
  async getUnreadCount(
    userId: string,
    tenantId: string,
    bizType?: string,
  ): Promise<number> {
    // 单类型：走缓存
    if (bizType) {
      const cached = await getUnreadCache(tenantId, userId, bizType);
      if (cached !== null) return cached;
      const count = await this.repository.countUnread(
        userId,
        tenantId,
        bizType,
      );
      await setUnreadCache(tenantId, userId, count, bizType);
      return count;
    }
    // 全部：走缓存
    const cached = await getUnreadCache(tenantId, userId);
    if (cached !== null) return cached;
    const count = await this.repository.countUnread(userId, tenantId);
    await setUnreadCache(tenantId, userId, count);
    return count;
  }

  async getUnreadSummary(
    userId: string,
    tenantId: string,
  ): Promise<UnreadSummary> {
    const rows = await this.repository.countUnreadGroupByType(userId, tenantId);
    const byType: Record<string, number> = {};
    let total = 0;
    for (const r of rows) {
      byType[r.biz_type] = r.count;
      total += r.count;
    }
    return { total, byType };
  }

  /* ============================================================
   * 标记已读
   * ============================================================ */
  async markRead(
    messageId: string,
    userId: string,
    tenantId: string,
  ): Promise<void> {
    const affected = await this.repository.markRead(
      messageId,
      userId,
      tenantId,
    );
    if (affected === 0) {
      // 已经读过或不存在：幂等，不报错
      return;
    }
    await invalidateUnreadCache(tenantId, [userId]);
  }

  async markReadBatch(
    messageIds: string[],
    userId: string,
    tenantId: string,
  ): Promise<{ updated: number }> {
    if (messageIds.length > BATCH_READ_MAX) {
      throw new AppError(`单次最多标记 ${BATCH_READ_MAX} 条`, 400001, 400);
    }
    // 归属校验
    await this.repository.assertOwnership(messageIds, userId, tenantId);
    const updated = await this.repository.markReadBatch(
      messageIds,
      userId,
      tenantId,
    );
    if (updated > 0) await invalidateUnreadCache(tenantId, [userId]);
    return { updated };
  }

  async markAllRead(
    userId: string,
    tenantId: string,
    bizType?: string,
  ): Promise<{ updated: number }> {
    const updated = await this.repository.markAllRead(
      userId,
      tenantId,
      bizType,
    );
    await invalidateUnreadCache(tenantId, [userId]);
    return { updated };
  }

  /* ============================================================
   * 删除
   * ============================================================ */
  async remove(
    messageId: string,
    userId: string,
    tenantId: string,
  ): Promise<void> {
    const affected = await this.repository.softDeleteOne(
      messageId,
      userId,
      tenantId,
    );
    if (affected === 0) {
      throw new AppError("消息不存在或已删除", 404001, 404);
    }
    await invalidateUnreadCache(tenantId, [userId]);
  }

  async removeBatch(
    messageIds: string[],
    userId: string,
    tenantId: string,
  ): Promise<{ deleted: number }> {
    if (messageIds.length > BATCH_DELETE_MAX) {
      throw new AppError(`单次最多删除 ${BATCH_DELETE_MAX} 条`, 400001, 400);
    }
    await this.repository.assertOwnership(messageIds, userId, tenantId);
    const deleted = await this.repository.softDeleteBatch(
      messageIds,
      userId,
      tenantId,
    );
    if (deleted > 0) await invalidateUnreadCache(tenantId, [userId]);
    return { deleted };
  }

  async clearRead(
    userId: string,
    tenantId: string,
  ): Promise<{ deleted: number }> {
    const deleted = await this.repository.clearRead(userId, tenantId);
    await invalidateUnreadCache(tenantId, [userId]);
    return { deleted };
  }
}
