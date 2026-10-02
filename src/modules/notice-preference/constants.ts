export const NOTIFY_CHANNEL = {
  IN_APP: "in_app",
  EMAIL: "email",
  SMS: "sms",
  WEBHOOK: "webhook",
} as const;
export type NotifyChannel =
  (typeof NOTIFY_CHANNEL)[keyof typeof NOTIFY_CHANNEL];
export const NOTIFY_CHANNELS = Object.values(NOTIFY_CHANNEL);

export const NOTIFY_EVENT = {
  NOTICE: "notice",
  TODO: "todo",
  WORKFLOW: "workflow",
  ANNOUNCEMENT: "announcement",
  SYSTEM: "system",
} as const;
export type NotifyEvent = (typeof NOTIFY_EVENT)[keyof typeof NOTIFY_EVENT];
export const NOTIFY_EVENTS = Object.values(NOTIFY_EVENT);

/** 特殊值：代表"全部" */
export const EVENT_ALL = "*";

export const PREF_CACHE_TTL = 300;
