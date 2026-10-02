import { CcRepository } from "../repository/cc.repository.js";
import { AppError } from "@/core/errors.js";
import type { CcListQuery } from "../repository/cc.repository.js";

const BATCH_READ_MAX = 100;

export class CcService {
  private repo = new CcRepository();

  /* ============================================================
   * 我的抄送列表
   * ============================================================ */
  async listMine(userId: string, tenantId: string, query: CcListQuery) {
    return this.repo.findMyPage(userId, tenantId, query);
  }

  async countUnread(userId: string, tenantId: string): Promise<number> {
    return this.repo.countUnread(userId, tenantId);
  }

  /* ============================================================
   * 标记已读
   * ============================================================ */
  async markRead(
    ccId: string,
    userId: string,
    tenantId: string,
  ): Promise<void> {
    await this.repo.markRead(ccId, userId, tenantId);
    // 幂等：已读或无记录都静默成功
  }

  async markReadBatch(
    ccIds: string[],
    userId: string,
    tenantId: string,
  ): Promise<{ updated: number }> {
    if (ccIds.length > BATCH_READ_MAX) {
      throw new AppError(`单次最多标记 ${BATCH_READ_MAX} 条`, 400001, 400);
    }
    await this.repo.assertOwnership(ccIds, userId, tenantId);
    const updated = await this.repo.markReadBatch(ccIds, userId, tenantId);
    return { updated };
  }

  async markAllRead(
    userId: string,
    tenantId: string,
  ): Promise<{ updated: number }> {
    const updated = await this.repo.markAllRead(userId, tenantId);
    return { updated };
  }

  /* ============================================================
   * 供实例详情用
   * ============================================================ */
  async findByInstance(instanceId: string, tenantId: string) {
    return this.repo.findByInstance(instanceId, tenantId);
  }
}

export const ccService = new CcService();
