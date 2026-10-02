import { MessageRepository } from "../repository.js";
import { invalidateUnreadCache } from "../cache.js";
import { logger } from "@/platform/logger/index.js";
import { publishMessagePush } from "@/platform/ws/index.js";
import type { PushMessageParams } from "../types.js";

const MAX_BATCH = 1000;

/**
 * 消息推送服务
 * - 供其他模块（通知/工作流/待办/系统）调用
 * - 不走 HTTP，直接调用
 * - 不抛错（fail-soft），失败仅记日志
 */
export class MessagePushService {
  private repo = new MessageRepository();

  async push(params: PushMessageParams): Promise<number> {
    const { userIds, realtime = true } = params;

    if (!userIds || userIds.length === 0) return 0;
    if (userIds.length > MAX_BATCH) {
      logger.warn(
        { count: userIds.length, max: MAX_BATCH },
        "[message] 推送数量超限，已截断",
      );
    }
    const receivers = [...new Set(userIds)].slice(0, MAX_BATCH);

    try {
      // 1. 写库
      const rows = receivers.map((userId) => ({
        tenantId: params.tenantId,
        userId,
        bizType: params.bizType,
        bizId: params.bizId ?? null,
        title: params.title,
        content: params.content ?? null,
        priority: params.priority ?? 0,
        isTop: params.isTop ?? 0,
        expireAt: params.expireAt ?? null,
      }));
      const inserted = await this.repo.batchInsert(rows);

      // 2. 失效未读数缓存
      await invalidateUnreadCache(params.tenantId, receivers);

      // 3. 实时推送（可选）
      if (realtime) {
        await publishMessagePush({
          tenantId: params.tenantId,
          receiverIds: receivers,
          payload: {
            bizType: params.bizType,
            bizId: params.bizId ?? null,
            title: params.title,
            content: params.content ?? null,
            priority: params.priority ?? 0,
          },
        }).catch((err) => {
          logger.warn({ err }, "[message] realtime push failed");
        });
      }

      logger.debug(
        { tenantId: params.tenantId, count: receivers.length, inserted },
        "[message] pushed",
      );
      return inserted;
    } catch (err) {
      logger.error(
        { err, tenantId: params.tenantId, bizType: params.bizType },
        "[message] push failed",
      );
      return 0;
    }
  }

  /** 单用户推送便捷方法 */
  async pushToUser(
    tenantId: string,
    userId: string,
    params: Omit<PushMessageParams, "tenantId" | "userIds">,
  ): Promise<number> {
    return this.push({ ...params, tenantId, userIds: [userId] });
  }
}

export const messagePushService = new MessagePushService();
