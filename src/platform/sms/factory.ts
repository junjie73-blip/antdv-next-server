import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import {
  AliyunSmsClient,
  TencentSmsClient,
  HuaweiSmsClient,
} from "./providers/index.js";
import { SMS_PROVIDER } from "./constants.js";
import type { SmsClient, SmsConfig } from "./types.js";

/**
 * 根据 config 构建 SmsClient
 * 用于 NoticeChannel 的 sms 渠道
 */
export function buildSmsClient(config: SmsConfig): SmsClient {
  if (!config.provider) {
    throw new AppError("短信 provider 未配置", 500001, 500);
  }

  switch (config.provider) {
    case SMS_PROVIDER.ALIYUN:
      return new AliyunSmsClient(config);
    case SMS_PROVIDER.TENCENT:
      return new TencentSmsClient(config);
    case SMS_PROVIDER.HUAWEI:
      return new HuaweiSmsClient(config);
    default:
      throw new AppError(
        `不支持的短信 provider: ${config.provider}`,
        400001,
        400,
      );
  }
}

/**
 * 从渠道配置 JSON 解析 SmsConfig
 * - 兼容多种 key 命名（accessKey / accessKeyId / secretKey / accessKeySecret）
 */
export function parseSmsConfig(raw: Record<string, unknown>): SmsConfig | null {
  if (!raw || typeof raw !== "object") return null;

  const provider = String(raw.provider ?? "").toLowerCase();
  if (!provider) {
    logger.warn("[sms] config.provider 缺失");
    return null;
  }

  const cfg: SmsConfig = {
    provider,
    accessKey: str(raw.accessKey ?? raw.accessKeyId ?? raw.secretId),
    accessKeySecret: str(raw.accessKeySecret ?? raw.secretKey),
    accessKeyId: str(raw.accessKeyId ?? raw.accessKey ?? raw.secretId),
    secretKey: str(raw.secretKey),
    secretId: str(raw.secretId),
    appKey: str(raw.appKey),
    appSecret: str(raw.appSecret),
    signName: str(raw.signName),
    defaultTemplateId: str(raw.defaultTemplateId ?? raw.templateId),
    region: str(raw.region),
    endpoint: str(raw.endpoint),
    sender: str(raw.sender),
  };

  // 基础必填检查
  if (provider === SMS_PROVIDER.ALIYUN) {
    if (!cfg.accessKeyId || !cfg.accessKeySecret) return null;
  } else if (provider === SMS_PROVIDER.TENCENT) {
    if (!cfg.secretId || !cfg.secretKey) return null;
  } else if (provider === SMS_PROVIDER.HUAWEI) {
    if (!cfg.appKey || !cfg.appSecret || !cfg.endpoint) return null;
  } else {
    return null;
  }

  return cfg;
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}
