import { parseSmtpConfig, sendMail } from "@/platform/email/service.js";
import { NoticeChannel, SendContext, SendResult } from "./base.js";
import { renderNoticeEmail } from "@/modules/notice/template/email-template.js";
import { env } from "@/config/env.js";

export const emailChannel: NoticeChannel = {
  type: "email",
  isReady: (cfg) => parseSmtpConfig(cfg) !== null,

  async send(ctx: SendContext): Promise<SendResult> {
    const smtp = parseSmtpConfig(ctx.config);
    if (!smtp) {
      return {
        channel: this.type,
        total: ctx.receivers.length,
        success: 0,
        failed: ctx.receivers.length,
        errors: ctx.receivers.map((r) => ({
          receiver: r,
          reason: "SMTP not configured",
        })),
      };
    }

    const errors: SendResult["errors"] = [];
    let success = 0;
    const html = renderNoticeEmail({
      title: ctx.title,
      content: ctx.content,
      noticeType: ctx.config?.noticeType,
      publishTime: ctx.config?.publishTime,
      systemName: env?.SYSTEM_NAME ?? "通知中心",
      brandColor: ctx.config?.brandColor ?? "#0F172A",
    });
    for (const to of ctx.receivers) {
      const ok = await sendMail({
        to,
        subject: ctx.title,
        html,
        // ⭐ 把租户配置透下去（需要 mail.ts 支持 smtp 参数）
        smtp,
      } as any);
      if (ok) success++;
      else errors.push({ receiver: to, reason: "SMTP send failed" });
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
