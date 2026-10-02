import { getTraceId } from "@/core/context/trace.js";

export const baseFormatter = {
  level: (label: string) => ({ level: label.toUpperCase() }),
  bindings: () => ({ traceId: getTraceId() }),
};

export const redactPaths = [
  // 顶层
  "password",
  "token",
  "authorization",
  "cookie",
  // 云存储
  "*.accessKey",
  "*.accessKeyId",
  "*.accessKeySecret",
  "*.secretKey",
  "*.secretId",
  "*.minioAccessKey",
  "*.minioSecretKey",
  "*.ossAccessKeyId",
  "*.ossAccessKeySecret",
  "*.s3AccessKeyId",
  "*.s3AccessKeySecret",
  // SMTP
  "*.smtpPass",
  "*.smtpUser",
  // Webhook
  "*.webhookSecret",
  // 敏感个人信息
  "*.phone",
  "*.email",
  "*.idCard",
  // 嵌套
  "req.headers.authorization",
  "req.headers.cookie",
  "res.headers['set-cookie']",
];
