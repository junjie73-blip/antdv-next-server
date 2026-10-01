import { subRedis, redis } from "@/config/redis.js";
import { wsManager } from "./manager.js";
import { logger } from "@/platform/logger/index.js";
import { rpNotificationWsPushTotal } from "@/platform/metrics/report.js";

const REPORT_NOTIFY_CHANNEL = "report:notify";

export type RpNotifyEventType =
  | "export_completed"
  | "export_failed"
  | "warm_completed"
  | "warm_failed";

export interface ReportNotifyPayload {
  userId: string;
  tenantId: string;
  eventType: RpNotifyEventType;
  reportCode: string;
  reportName: string;
  title: string;
  content: string;
  /** 导出任务关联 */
  taskId?: string;
  /** 文件下载 URL（导出完成时） */
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  rowCount?: number;
  at?: number;
}

/**
 * 发布报表通知
 */
export async function publishReportNotify(
  payload: Omit<ReportNotifyPayload, "at">,
): Promise<void> {
  const finalPayload: ReportNotifyPayload = {
    ...payload,
    at: Date.now(),
  };

  try {
    await redis.publish(REPORT_NOTIFY_CHANNEL, JSON.stringify(finalPayload));
    rpNotificationWsPushTotal.labels(payload.eventType, "published").inc();
  } catch (err) {
    rpNotificationWsPushTotal.labels(payload.eventType, "failed").inc();
    logger.error(
      { err, userId: payload.userId, eventType: payload.eventType },
      "[rp-notify] publish failed",
    );
    throw err;
  }
}

/**
 * 订阅报表通知频道
 */
export async function startReportNotifySubscriber(): Promise<void> {
  try {
    await subRedis.subscribe(REPORT_NOTIFY_CHANNEL);

    subRedis.on("message", (channel: string, message: string) => {
      if (channel !== REPORT_NOTIFY_CHANNEL) return;

      try {
        const data = JSON.parse(message) as ReportNotifyPayload;

        if (!data.userId) {
          logger.warn({ message }, "[rp-notify] 消息缺少 userId");
          return;
        }

        wsManager.sendToUsers([data.userId], {
          type: "report:notify",
          data: {
            noticeId: `rp-${data.eventType}-${data.taskId ?? data.reportCode}-${data.at}`,
            title: data.title,
            content: data.content,
            noticeType: 1,
            isRead: 0,
            source: "report",
            priority: data.eventType.includes("failed") ? 1 : 0,
            publishTime: new Date(data.at ?? Date.now()).toISOString(),
            bizType: data.eventType,
            bizId: data.taskId ?? data.reportCode,
            bizSource: "report",
          },
          timestamp: Date.now(),
        });

        rpNotificationWsPushTotal.labels(data.eventType, "success").inc();
      } catch (err) {
        logger.error({ err, message }, "[rp-notify] handle message failed");
      }
    });

    subRedis.on("error", (err) =>
      logger.error({ err }, "Report-notify subscriber error"),
    );

    logger.info(`Subscribed to Redis channel: ${REPORT_NOTIFY_CHANNEL}`);
  } catch (err) {
    logger.error({ err }, "Failed to subscribe to report:notify channel");
  }
}
