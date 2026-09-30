export const NOTICE_CHANNEL = {
  IN_APP: "in_app",
  EMAIL: "email",
  SMS: "sms",
  WEBHOOK: "webhook",
  WECHAT_WORK: "wechat_work",
  DINGTALK: "dingtalk",
} as const;

export type NoticeChannelType =
  (typeof NOTICE_CHANNEL)[keyof typeof NOTICE_CHANNEL];

export const NOTICE_PRIORITY = {
  NORMAL: 0,
  IMPORTANT: 1,
  URGENT: 2,
} as const;

export type NoticePriority =
  (typeof NOTICE_PRIORITY)[keyof typeof NOTICE_PRIORITY];
