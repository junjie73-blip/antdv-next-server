import { subRedis, redis } from "@/config/redis.js";
import { wsManager } from "./manager.js";
import { logger } from "@/platform/logger/index.js";
import {
  wfNotificationWsPushTotal,
  wfNotificationWsPushDuration,
} from "@/platform/metrics/index.js";

const WORKFLOW_NOTIFY_CHANNEL = "workflow:notify";

export type WfNotifyEventType =
  | "assign"
  | "complete"
  | "reject"
  | "timeout"
  | "terminate"
  | "cc"
  | "start";

export interface WorkflowNotifyPayload {
  userId: string;
  tenantId: string;
  instanceId: string;
  taskId?: string;
  nodeId?: string;
  eventType: WfNotifyEventType;
  title: string;
  content: string;
  /** 关联的业务来源（approval / workflow） */
  bizSource?: "approval" | "workflow";
  bizId?: string;
  priority?: number;
  at?: number;
}

/**
 * 发布工作流通知（供 wf-notify.worker 调用）
 * 通过 Redis Pub/Sub 广播，各实例推自己的 WS 连接
 */
export async function publishWorkflowNotify(
  payload: Omit<WorkflowNotifyPayload, "at">,
): Promise<void> {
  const start = Date.now();
  const finalPayload: WorkflowNotifyPayload = {
    ...payload,
    at: Date.now(),
  };

  try {
    await redis.publish(WORKFLOW_NOTIFY_CHANNEL, JSON.stringify(finalPayload));

    wfNotificationWsPushTotal.labels(payload.eventType, "published").inc();
    wfNotificationWsPushDuration
      .labels("publish")
      .observe((Date.now() - start) / 1000);

    logger.debug(
      {
        userId: payload.userId,
        instanceId: payload.instanceId,
        eventType: payload.eventType,
      },
      "[wf-notify] published",
    );
  } catch (err) {
    wfNotificationWsPushTotal.labels(payload.eventType, "failed").inc();
    logger.error(
      { err, userId: payload.userId, eventType: payload.eventType },
      "[wf-notify] publish failed",
    );
    throw err;
  }
}

/**
 * 订阅工作流通知频道
 */
export async function startWorkflowNotifySubscriber(): Promise<void> {
  try {
    await subRedis.subscribe(WORKFLOW_NOTIFY_CHANNEL);

    subRedis.on("message", (channel: string, message: string) => {
      if (channel !== WORKFLOW_NOTIFY_CHANNEL) return;

      const start = Date.now();
      try {
        const data = JSON.parse(message) as WorkflowNotifyPayload;

        if (!data.userId) {
          logger.warn({ message }, "[wf-notify] 消息缺少 userId");
          return;
        }

        // 通过 wsManager 推送给目标用户
        wsManager.sendToUsers([data.userId], {
          type: "workflow:notify",
          data: {
            noticeId: `wf-${data.taskId ?? data.instanceId}-${data.at}`,
            title: data.title,
            content: data.content,
            noticeType: 1,
            isRead: 0,
            source: "workflow",
            priority: data.priority ?? 0,
            publishTime: new Date(data.at ?? Date.now()).toISOString(),
            bizType: data.eventType,
            bizId: data.instanceId,
            bizSource: data.bizSource ?? "workflow",
            taskId: data.taskId,
            nodeId: data.nodeId,
          },
          timestamp: Date.now(),
        });

        wfNotificationWsPushTotal.labels(data.eventType, "success").inc();
        wfNotificationWsPushDuration
          .labels("broadcast")
          .observe((Date.now() - start) / 1000);
      } catch (err) {
        logger.error({ err, message }, "[wf-notify] handle message failed");
      }
    });

    subRedis.on("error", (err) =>
      logger.error({ err }, "Workflow-notify subscriber error"),
    );

    logger.info(`Subscribed to Redis channel: ${WORKFLOW_NOTIFY_CHANNEL}`);
  } catch (err) {
    logger.error({ err }, "Failed to subscribe to workflow:notify channel");
  }
}
