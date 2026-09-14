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
      try {
        await sendMail({
          to,
          subject: ctx.title,
          html: ctx.content ?? ctx.title,
        });
        success++;
      } catch (e: any) {
        errors.push({ receiver: to, reason: String(e?.message ?? e) });
      }
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
