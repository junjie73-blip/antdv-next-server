import { logger } from "@/platform/logger/index.js";
import { httpAgent, httpsAgent } from "@/shared/http/agent.js";
import type {
  SmsClient,
  SmsConfig,
  SmsSendParams,
  SmsSendResult,
} from "../types.js";
import { SMS_SEND_TIMEOUT_MS } from "../constants.js";
import { createHmac, randomUUID } from "node:crypto";

const ENDPOINT = "https://dysmsapi.aliyuncs.com";

interface AliyunResponse {
  Code: string;
  Message: string;
  RequestId: string;
  BizId?: string;
}

/**
 * 阿里云短信（Dysmsapi 2017-05-25）
 * - 使用 RPC 签名 v3 或 ACS3-HMAC-SHA256（推荐）
 * - 为简化，这里用传统的 HMAC-SHA1 签名（仍被支持）
 */
export class AliyunSmsClient implements SmsClient {
  readonly provider = "aliyun";

  constructor(private config: SmsConfig) {
    if (!config.accessKeyId || !config.accessKeySecret) {
      throw new Error("阿里云短信：accessKeyId / accessKeySecret 未配置");
    }
  }

  async send(p: SmsSendParams): Promise<SmsSendResult> {
    const [r] = await this.sendBatch([p]);
    return r;
  }

  async sendBatch(params: SmsSendParams[]): Promise<SmsSendResult[]> {
    // 阿里云支持 SendBatchSms，但每个号码模板参数可不同 → 简化用单发并发
    return Promise.all(params.map((p) => this.sendOne(p)));
  }

  private async sendOne(p: SmsSendParams): Promise<SmsSendResult> {
    try {
      const query: Record<string, string> = {
        Action: "SendSms",
        Version: "2017-05-25",
        RegionId: this.config.region ?? "cn-hangzhou",
        PhoneNumbers: p.phone,
        SignName: p.signName ?? this.config.signName ?? "",
        TemplateCode: p.templateId,
        TemplateParam: JSON.stringify(p.params),
        Timestamp: new Date().toISOString(),
        Format: "JSON",
        SignatureMethod: "HMAC-SHA1",
        SignatureVersion: "1.0",
        SignatureNonce: crypto.randomUUID(),
        AccessKeyId: this.config.accessKeyId!,
      };

      const signature = signRpc(query, this.config.accessKeySecret!);
      const url = `${ENDPOINT}/?${toQuery({ ...query, Signature: signature })}`;

      const res = await fetchWithTimeout(url, SMS_SEND_TIMEOUT_MS);
      const data = (await res.json()) as AliyunResponse;

      if (data.Code === "OK") {
        return { phone: p.phone, success: true, providerMessageId: data.BizId };
      }
      return {
        phone: p.phone,
        success: false,
        errorCode: data.Code,
        errorMessage: data.Message,
      };
    } catch (err: any) {
      logger.warn(
        { err, phone: maskPhone(p.phone) },
        "[sms:aliyun] send failed",
      );
      return {
        phone: p.phone,
        success: false,
        errorCode: "NETWORK_ERROR",
        errorMessage: String(err?.message ?? err),
      };
    }
  }
}

/* ============================================================
 * 签名（阿里云 RPC 风格）
 * ============================================================ */

function signRpc(params: Record<string, string>, secret: string): string {
  const sorted = Object.keys(params).sort();
  const canonical = sorted
    .map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join("&");

  const stringToSign = `GET&${percentEncode("/")}&${percentEncode(canonical)}`;
  const hmac = createHmac("sha1", secret + "&")
    .update(stringToSign)
    .digest("base64");
  return hmac;
}

function percentEncode(s: string): string {
  return encodeURIComponent(s)
    .replace(/\+/g, "%20")
    .replace(/\*/g, "%2A")
    .replace(/%7E/g, "~");
}

function toQuery(obj: Record<string, string>): string {
  return Object.entries(obj)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
}
