/** 所有事件必须包含的元信息 */
export interface EventMeta {
  eventId: string;
  eventType: string;
  eventVersion: string;
  occurredAt: string;
  tenantId: string;
  userId?: string;
  traceId?: string;
  source: string;
}

/** 事件处理器 */
export type EventHandler<E> = (event: E) => Promise<void>;

/** 事件主题 */
export const EVENT_TOPICS = {
  USER: "user.events",
  NOTICE: "notice.events",
  AUDIT: "audit.events",
  FILE: "file.events",
} as const;

export type EventTopic = (typeof EVENT_TOPICS)[keyof typeof EVENT_TOPICS];
