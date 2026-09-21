import { NoticeChannel, SendContext, SendResult } from "./base.js";
import { logger } from "@/platform/logger/index.js";

export const smsChannel: NoticeChannel = {
  type: "sms",
  isReady: (cfg) =>
    !!(
      cfg.provider &&
      (cfg.accessKey || cfg.accessKeyId) &&
      (cfg.secretKey || cfg.accessKeySecret)
    ),
  async send(ctx: SendContext): Promise<SendResult> {
    logger.info(
      { receivers: ctx.receivers, len: ctx.receivers.length },
      "[sms] stub send",
    );
    // TODO: 接入阿里云/腾讯云短信
    return {
      channel: this.type,
      total: ctx.receivers.length,
      success: 0,
      failed: ctx.receivers.length,
      errors: ctx.receivers.map((r) => ({
        receiver: r,
        reason: "not implemented",
      })),
    };
  },
};
