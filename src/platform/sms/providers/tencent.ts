import { createHmac, createHash } from "node:crypto";
import { logger } from "@/platform/logger/index.js";
import type {
  SmsClient,
  SmsConfig,
  SmsSendParams,
  SmsSendResult,
} from "../types.js";
import { SMS_SEND_TIMEOUT_MS } from "../constants.js";

const ENDPOINT = "sms.tencentcloudapi.com";
const SERVICE = "sms";
const VERSION = "2021-01-11";
const REGION = "ap-guangzhou";

export class TencentSmsClient implements SmsClient {
  readonly provider = "tencent";

  constructor(private config: SmsConfig) {
    if (!config.secretId || !config.secretKey) {
      throw new Error("腾讯云短信：secretId / secretKey 未配置");
    }
  }

  async send(p: SmsSendParams): Promise<SmsSendResult> {
    const [r] = await this.sendBatch([p]);
    return r;
  }

  async sendBatch(params: SmsSendParams[]): Promise<SmsSendResult[]> {
    // 腾讯云支持一次多号码同模板，但参数不同 → 简化用单发并发
    return Promise.all(params.map((p) => this.sendOne(p)));
  }

  private async sendOne(p: SmsSendParams): Promise<SmsSendResult> {
    try {
      const phone = normalizeCnPhone(p.phone);
      const body = {
        PhoneNumberSet: [`+86${phone}`],
        SmsSdkAppId: (this.config as any).sdkAppId ?? "",
        SignName: p.signName ?? this.config.signName ?? "",
        TemplateId: p.templateId,
        TemplateParamSet: Object.values(p.params),
      };

      const bodyStr = JSON.stringify(body);
      const headers = signTc3(
        bodyStr,
        this.config.secretId!,
        this.config.secretKey!,
      );

      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), SMS_SEND_TIMEOUT_MS);
      let data: any;
      try {
        const res = await fetch(`https://${ENDPOINT}`, {
          method: "POST",
          headers,
          body: bodyStr,
          signal: ctrl.signal,
        });
        data = await res.json();
      } finally {
        clearTimeout(timer);
      }

      const first = data?.Response?.SendStatusSet?.[0];
      if (first?.Code === "Ok") {
        return {
          phone: p.phone,
          success: true,
          providerMessageId: first.SerialNo,
        };
      }
      return {
        phone: p.phone,
        success: false,
        errorCode: first?.Code ?? data?.Response?.Error?.Code,
        errorMessage: first?.Message ?? data?.Response?.Error?.Message,
      };
    } catch (err: any) {
      logger.warn(
        { err, phone: maskPhone(p.phone) },
        "[sms:tencent] send failed",
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
 * 腾讯云 TC3-HMAC-SHA256 签名
 * ============================================================ */
function signTc3(
  body: string,
  secretId: string,
  secretKey: string,
): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);

  const hashedPayload = createHash("sha256").update(body).digest("hex");
  const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${ENDPOINT}\n`;
  const signedHeaders = "content-type;host";
  const canonicalRequest = [
    "POST",
    "/",
    "",
    canonicalHeaders,
    signedHeaders,
    hashedPayload,
  ].join("\n");

  const credentialScope = `${date}/${SERVICE}/tc3_request`;
  const stringToSign = [
    "TC3-HMAC-SHA256",
    timestamp,
    credentialScope,
    createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");

  const kDate = hmac256(`TC3${secretKey}`, date);
  const kService = hmac256(kDate, SERVICE);
  const kSigning = hmac256(kService, "tc3_request");
  const signature = createHmac("sha256", kSigning)
    .update(stringToSign)
    .digest("hex");

  const authorization = `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    Authorization: authorization,
    "Content-Type": "application/json; charset=utf-8",
    Host: ENDPOINT,
    "X-TC-Action": "SendSms",
    "X-TC-Version": VERSION,
    "X-TC-Timestamp": String(timestamp),
    "X-TC-Region": REGION,
  };
}

function hmac256(key: string | Buffer, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

function normalizeCnPhone(p: string): string {
  return p.replace(/^\+86/, "").replace(/^86/, "");
}

function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
}
