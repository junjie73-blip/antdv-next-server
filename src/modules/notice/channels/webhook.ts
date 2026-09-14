// webhook.ts
import { NoticeChannel, SendContext, SendResult } from "./base.js";

export const webhookChannel: NoticeChannel = {
  type: "webhook",
  isReady: (cfg) => !!(cfg.url && typeof cfg.url === "string"),
  async send(ctx: SendContext): Promise<SendResult> {
    const errors: SendResult["errors"] = [];
    let success = 0;
    for (const url of ctx.receivers) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: ctx.title,
            content: ctx.content,
            noticeId: ctx.noticeId,
          }),
        });
        if (res.ok) success++;
        else errors.push({ receiver: url, reason: `HTTP ${res.status}` });
      } catch (e: any) {
        errors.push({ receiver: url, reason: String(e?.message ?? e) });
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
