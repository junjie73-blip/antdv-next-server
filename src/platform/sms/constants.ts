export const SMS_PROVIDER = {
  ALIYUN: "aliyun",
  TENCENT: "tencent",
  HUAWEI: "huawei",
} as const;

export type SmsProvider = (typeof SMS_PROVIDER)[keyof typeof SMS_PROVIDER];
export const SMS_PROVIDERS = Object.values(SMS_PROVIDER);

/** 单次批量接收人上限（各厂商限制不同，取最小值） */
export const SMS_BATCH_MAX = 100;

/** 单条短信最大长度 */
export const SMS_MAX_LEN = 500;

/** 发送超时（ms） */
export const SMS_SEND_TIMEOUT_MS = 10_000;
