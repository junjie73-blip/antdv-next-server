import { parseSmtpConfig, sendMail } from "@/platform/email/service.js";
import { NoticeChannel, SendContext, SendResult } from "./base.js";
import {
  renderNoticeEmail,
  renderTemplateEmail,
} from "@/modules/notice/template/email-template.js";
import {
  buildDefaultContext,
  renderTemplateToHtml,
  replaceVars,
} from "@/modules/notice/template/renderer.js";
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
    const baseContext = buildDefaultContext();

    for (const to of ctx.receivers) {
      // ⭐ per-receiver 上下文
      const meta = ctx.receiverMeta?.[to] ?? {};
      const renderContext = {
        ...baseContext,
        userName: meta.userName,
        realName: meta.realName,
        deptName: meta.deptName,
      };

      let html: string;
      let subject: string;

      if (ctx.template) {
        // ⭐ 使用消息模板
        const tplTitle = ctx.template.title
          ? replaceVars(ctx.template.title, renderContext)
          : ctx.title;
        const contentHtml = renderTemplateToHtml(
          ctx.template.content,
          ctx.template.contentFormat,
          renderContext,
        );

        subject = tplTitle || ctx.title;
        html = renderTemplateEmail({
          title: tplTitle || ctx.title,
          contentHtml,
          noticeType: ctx.config?.noticeType ?? 1,
          publishTime: ctx.config?.publishTime ?? new Date(),
          systemName: env?.SYSTEM_NAME ?? "通知中心",
          brandColor: ctx.config?.brandColor ?? "#0F172A",
          receiverName: meta.realName ?? meta.userName,
        });
      } else {
        // ⭐ 默认模板
        const title = replaceVars(ctx.title, renderContext);
        const content = ctx.content
          ? replaceVars(ctx.content, renderContext)
          : undefined;

        subject = title;
        html = renderNoticeEmail({
          title,
          content,
          noticeType: ctx.config?.noticeType,
          publishTime: ctx.config?.publishTime,
          systemName: env?.SYSTEM_NAME ?? "通知中心",
          brandColor: ctx.config?.brandColor ?? "#0F172A",
          receiverName: meta.realName ?? meta.userName,
        });
      }

      const ok = await sendMail({
        to,
        subject,
        html,
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
