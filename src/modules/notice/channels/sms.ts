import { NoticeChannel, SendContext, SendResult } from "./base.js";
import { logger } from "@/platform/logger/index.js";
import { buildSmsClient, parseSmsConfig } from "@/platform/sms/index.js";

export const smsChannel: NoticeChannel = {
  type: "sms",
  isReady: (cfg) => parseSmsConfig(cfg) !== null,

  async send(ctx: SendContext): Promise<SendResult> {
    const cfg = parseSmsConfig(ctx.config);
    if (!cfg) {
      return {
        channel: this.type,
        total: ctx.receivers.length,
        success: 0,
        failed: ctx.receivers.length,
        errors: ctx.receivers.map((r) => ({
          receiver: r,
          reason: "SMS provider not configured",
        })),
      };
    }

    let client;
    try {
      client = buildSmsClient(cfg);
    } catch (err: any) {
      logger.error({ err }, "[sms] client build failed");
      return {
        channel: this.type,
        total: ctx.receivers.length,
        success: 0,
        failed: ctx.receivers.length,
        errors: ctx.receivers.map((r) => ({
          receiver: r,
          reason: `client init failed: ${err.message}`,
        })),
      };
    }

    // 用模板渲染内容（简单文本）
    const templateId = ctx.template?.templateId ?? cfg.defaultTemplateId;
    if (!templateId) {
      return {
        channel: this.type,
        total: ctx.receivers.length,
        success: 0,
        failed: ctx.receivers.length,
        errors: ctx.receivers.map((r) => ({
          receiver: r,
          reason: "SMS 模板未配置",
        })),
      };
    }

    // 参数按规则传入，厂商模板里用 ${code} 之类占位
    const params: Record<string, string> = {
      // 常见的占位符（各家模板不同，这里给通用兜底）
      code: extractCodeFromContent(ctx.content ?? "") ?? "",
      content: (ctx.content ?? "").slice(0, 200),
      title: ctx.title,
    };

    const results = await client.sendBatch(
      ctx.receivers.map((phone) => ({
        phone,
        templateId,
        params,
        signName: cfg.signName,
      })),
    );

    const errors: SendResult["errors"] = [];
    let success = 0;
    for (const r of results) {
      if (r.success) success++;
      else
        errors.push({
          receiver: r.phone,
          reason: `${r.errorCode ?? "ERR"}: ${r.errorMessage ?? "send failed"}`,
        });
    }

    return {
      channel: this.type,
      total: ctx.receivers.length,
      success,
      failed: errors.length,
      errors,
    };
  },
};

function extractCodeFromContent(content: string): string | null {
  const m = content.match(/\b\d{4,6}\b/);
  return m ? m[0] : null;
}
