import { logger } from "@/platform/logger/index.js";
import {
  startNoticeSubscriber,
  startForceLogoutSubscriber,
  startUploadNotifySubscriber,
} from "@/platform/ws/index.js";

/**
 * 启动所有 Redis pub/sub 订阅
 * - 单个订阅失败不影响其他（fail-soft）
 */
export async function startSubscribers(): Promise<void> {
  const tasks = [
    { name: "notice", fn: startNoticeSubscriber },
    { name: "force-logout", fn: startForceLogoutSubscriber },
    { name: "upload-notify", fn: startUploadNotifySubscriber },
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
