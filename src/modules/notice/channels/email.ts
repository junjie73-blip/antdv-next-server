import { sendMail } from "@/common/utils/mail.js";
import { NoticeChannel, SendContext, SendResult } from "./base.js";

export const emailChannel: NoticeChannel = {
  type: "email",
  isReady: (cfg) =>
    !!(cfg.smtpHost && cfg.smtpUser && cfg.smtpPass && cfg.from),

  async send(ctx: SendContext): Promise<SendResult> {
    const errors: SendResult["errors"] = [];
    let success = 0;

    for (const to of ctx.receivers) {
      const ok = await sendMail({
        to,
        subject: ctx.title,
        html: ctx.content ?? ctx.title,
      });
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
