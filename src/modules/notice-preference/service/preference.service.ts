import { AppError } from "@/core/errors.js";
import { NoticePreferenceRepository } from "../repository.js";
import { DEFAULT_PREFERENCES } from "../defaults.js";
import { getPrefCache, setPrefCache, invalidatePrefCache } from "../cache.js";
import { EVENT_ALL } from "../constants.js";
import type { PreferenceBatchSetDTO } from "../schema.js";

export class NoticePreferenceService {
  private repo = new NoticePreferenceRepository();

  /* ============================================================
   * 查询用户偏好
   * ============================================================ */
  async getUserPreferences(userId: string, tenantId: string) {
    const cached = await getPrefCache(tenantId, userId);
    if (cached) return cached;

    const userRows = await this.repo.listByUser(userId, tenantId);
    const userSet = new Map(
      userRows.map((r) => [`${r.channel}:${r.event_type}`, r.enabled]),
    );

    // 合并默认值
    const result: Record<string, Record<string, number>> = {};
    for (const d of DEFAULT_PREFERENCES) {
      result[d.channel] ??= {};
      result[d.channel][d.eventType] =
        userSet.get(`${d.channel}:${d.eventType}`) ?? d.enabled;
    }
    // 用户自定义的、默认里没有的
    for (const r of userRows) {
      result[r.channel] ??= {};
      result[r.channel][r.event_type] = r.enabled;
    }

    await setPrefCache(tenantId, userId, result);
    return result;
  }

  /* ============================================================
   * 批量设置
   * ============================================================ */
  async setPreferences(
    userId: string,
    tenantId: string,
    dto: PreferenceBatchSetDTO,
  ) {
    // 校验 event/channel 合法（由 Zod 保证）
    await this.repo.batchUpsert(
      userId,
      tenantId,
      dto.items.map((it) => ({
        channel: it.channel,
        eventType: it.eventType,
        enabled: it.enabled,
      })),
    );
    await invalidatePrefCache(tenantId, userId);
  }

  /* ============================================================
   * 重置
   * ============================================================ */
  async reset(userId: string, tenantId: string, channel?: string) {
    await this.repo.deleteByUser(userId, tenantId, channel);
    await invalidatePrefCache(tenantId, userId);
  }

  /* ============================================================
   * ⭐ 派发时使用：过滤出允许的用户
   * 返回：{ allowed: string[], filtered: string[] }
   * ============================================================ */
  async filterAllowed(
    userIds: string[],
    tenantId: string,
    channel: string,
    eventType: string,
  ): Promise<{ allowed: string[]; filtered: string[] }> {
    if (userIds.length === 0) return { allowed: [], filtered: [] };

    const allowed = await this.repo.findAllowed(
      userIds,
      tenantId,
      channel,
      eventType,
    );
    const allowedSet = new Set(allowed);
    const filtered = userIds.filter((uid) => !allowedSet.has(uid));

    return { allowed, filtered };
  }
}

export const noticePreferenceService = new NoticePreferenceService();
