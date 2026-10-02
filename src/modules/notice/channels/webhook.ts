import { NoticeChannel, SendContext, SendResult } from "./base.js";
import { logger } from "@/platform/logger/index.js";
import { sendWithRetry } from "@/platform/webhook/index.js";

export const webhookChannel: NoticeChannel = {
  type: "webhook",
  isReady: (cfg) => !!(cfg.url && typeof cfg.url === "string"),

  async send(ctx: SendContext): Promise<SendResult> {
    const errors: SendResult["errors"] = [];
    let success = 0;

    const config = {
      url: "",
      secret: ctx.config?.secret as string | undefined,
      headers: ctx.config?.headers as Record<string, string> | undefined,
      enableIdempotency: ctx.config?.enableIdempotency === true,
    };

    for (const url of ctx.receivers) {
      config.url = url;
      const result = await sendWithRetry(config, {
        event: ctx.noticeId ? "notice.created" : "test.send",
        data: {
          title: ctx.title,
          content: ctx.content,
          noticeId: ctx.noticeId,
          timestamp: Date.now(),
        },
        idempotencyKey: ctx.noticeId ? `${ctx.noticeId}:${url}` : undefined,
      });

      if (result.success) success++;
      else
        errors.push({
          receiver: url,
          reason: `${result.error ?? "failed"} (attempts=${result.attempts}, status=${result.status ?? "-"})`,
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
