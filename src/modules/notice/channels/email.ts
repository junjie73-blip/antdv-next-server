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

/** ✅ 统一系统名兜底 */
const DEFAULT_SYSTEM_NAME = "通知中心";

function getSystemName(fallback?: string): string {
  return fallback || env?.SYSTEM_NAME || env?.APP_NAME || DEFAULT_SYSTEM_NAME;
}

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
    const systemName = getSystemName(ctx.config?.systemName); // ✅

    for (const to of ctx.receivers) {
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
          systemName, // ✅
          brandColor: ctx.config?.brandColor ?? "#0F172A",
          receiverName: meta.realName ?? meta.userName,
        });
      } else {
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
          systemName, // ✅
          brandColor: ctx.config?.brandColor ?? "#0F172A",
          receiverName: meta.realName ?? meta.userName,
        });
      }

      const ok = await sendMail({ to, subject, html, smtp } as any);
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
