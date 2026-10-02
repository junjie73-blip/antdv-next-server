import { NOTIFY_CHANNEL, NOTIFY_EVENT, EVENT_ALL } from "./constants.js";

/**
 * 默认偏好：
 * - 站内信：全部开启
 * - 邮件：只对通知/公告/工作流开启
 * - 短信：只对紧急工作流开启（保守）
 * - Webhook：默认关闭
 */
export const DEFAULT_PREFERENCES: Array<{
  channel: string;
  eventType: string;
  enabled: number;
}> = [
  { channel: NOTIFY_CHANNEL.IN_APP, eventType: EVENT_ALL, enabled: 1 },

  { channel: NOTIFY_CHANNEL.EMAIL, eventType: NOTIFY_EVENT.NOTICE, enabled: 1 },
  {
    channel: NOTIFY_CHANNEL.EMAIL,
    eventType: NOTIFY_EVENT.ANNOUNCEMENT,
    enabled: 1,
  },
  {
    channel: NOTIFY_CHANNEL.EMAIL,
    eventType: NOTIFY_EVENT.WORKFLOW,
    enabled: 1,
  },
  { channel: NOTIFY_CHANNEL.EMAIL, eventType: NOTIFY_EVENT.TODO, enabled: 0 },
  { channel: NOTIFY_CHANNEL.EMAIL, eventType: NOTIFY_EVENT.SYSTEM, enabled: 1 },

  { channel: NOTIFY_CHANNEL.SMS, eventType: NOTIFY_EVENT.WORKFLOW, enabled: 1 },

  { channel: NOTIFY_CHANNEL.WEBHOOK, eventType: EVENT_ALL, enabled: 0 },
];
