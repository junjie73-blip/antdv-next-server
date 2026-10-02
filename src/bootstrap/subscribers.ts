import { startConfigSubscriber } from "@/modules/system/setting/cache.js";
import { logger } from "@/platform/logger/index.js";
import {
  startForceLogoutSubscriber,
  startUploadNotifySubscriber,
  startWorkflowNotifySubscriber,
  startReportNotifySubscriber,
  startNoticePushSubscriber,
  wsManager,
} from "@/platform/ws/index.js";
import { NoticePushPayload } from "@/platform/ws/notice-pubsub.js";

/**
 * 启动所有 Redis pub/sub 订阅
 * - 单个订阅失败不影响其他（fail-soft）
 */
export async function startSubscribers(): Promise<void> {
  startNoticePushSubscriber((payload: NoticePushPayload) => {
    const { noticeId, action, receiverIds } = payload;

    const event = action === "revoke" ? "notice-revoke" : "notice";
    const message = {
      type: event,
      data: { noticeId },
      timestamp: Date.now(),
    };

    if (receiverIds && receiverIds.length > 0) {
      // 白名单：只推给指定用户
      // 优先使用批量方法（若 wsManager 已提供）
      if (typeof (wsManager as any).sendToUsers === "function") {
        (wsManager as any).sendToUsers(receiverIds, message);
      } else {
        for (const uid of receiverIds) {
          wsManager.sendToUser(uid, message);
        }
      }

      logger.debug(
        { noticeId, action, receivers: receiverIds.length },
        "[ws] notice pushed to whitelist",
      );
    } else {
      // 广播给所有在线连接
      wsManager.broadcast(message);
      logger.debug({ noticeId, action }, "[ws] notice broadcast");
    }
  });
  const tasks = [
    { name: "force-logout", fn: startForceLogoutSubscriber },
    { name: "upload-notify", fn: startUploadNotifySubscriber },
    { name: "config", fn: startConfigSubscriber },
    { name: "workflow-notify", fn: startWorkflowNotifySubscriber },
    { name: "report-notify", fn: startReportNotifySubscriber },
  ];

  const results = await Promise.allSettled(tasks.map((t) => t.fn()));

  const ok: string[] = [];
  const failed: string[] = [];

  results.forEach((r, i) => {
    if (r.status === "fulfilled") ok.push(tasks[i].name);
    else {
      failed.push(tasks[i].name);
      logger.error(
        { err: r.reason, channel: tasks[i].name },
        "[subscribers] start failed",
      );
    }
  });

  logger.info({ subscribed: ok, failed }, "[subscribers] bootstrap complete");
}
