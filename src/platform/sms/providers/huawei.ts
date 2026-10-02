import { logger } from "@/platform/logger/index.js";
import type {
  SmsClient,
  SmsConfig,
  SmsSendParams,
  SmsSendResult,
} from "../types.js";
import { SMS_SEND_TIMEOUT_MS } from "../constants.js";

export class HuaweiSmsClient implements SmsClient {
  readonly provider = "huawei";

  constructor(private config: SmsConfig) {
    if (!config.appKey || !config.appSecret || !config.endpoint) {
      throw new Error("华为云短信：appKey / appSecret / endpoint 未配置");
    }
  }

  async send(p: SmsSendParams): Promise<SmsSendResult> {
    const [r] = await this.sendBatch([p]);
    return r;
  }

  async sendBatch(params: SmsSendParams[]): Promise<SmsSendResult[]> {
    // 华为云支持一次 100 个号码，模板 ID 相同、参数相同
    // 简化：单发并发
    return Promise.all(params.map((p) => this.sendOne(p)));
  }

  private async sendOne(p: SmsSendParams): Promise<SmsSendResult> {
    try {
      const body = {
        from: this.config.sender ?? "",
        to: [p.phone],
        templateId: p.templateId,
        templateParas: Object.values(p.params),
        signature: p.signName ?? this.config.signName ?? "",
      };

      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), SMS_SEND_TIMEOUT_MS);
      let data: any;
      try {
        const res = await fetch(
          `${this.config.endpoint}/common/sms/sendTemplateMessage`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `WSSE realm="SDP",profile="UsernameToken",type="Appkey"`,
              "X-WSSE": buildWsse(this.config.appKey!, this.config.appSecret!),
            },
            body: JSON.stringify(body),
            signal: ctrl.signal,
          },
        );
        data = await res.json();
      } finally {
        clearTimeout(timer);
      }

      if (data?.code === "000000") {
        return {
          phone: p.phone,
          success: true,
          providerMessageId: data.result?.[0]?.smsMsgId,
        };
      }
      return {
        phone: p.phone,
        success: false,
        errorCode: data?.code,
        errorMessage: data?.description,
      };
    } catch (err: any) {
      logger.warn(
        { err, phone: maskPhone(p.phone) },
        "[sms:huawei] send failed",
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

import { createHash, randomUUID } from "node:crypto";

function buildWsse(appKey: string, appSecret: string): string {
  const nonce = randomUUID().replace(/-/g, "");
  const created = new Date().toISOString();
  const passwordDigest = createHash("sha256")
    .update(nonce + created + appSecret)
    .digest("base64");
  return `UsernameToken Username="${appKey}",PasswordDigest="${passwordDigest}",Nonce="${nonce}",Created="${created}"`;
}

function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
}
