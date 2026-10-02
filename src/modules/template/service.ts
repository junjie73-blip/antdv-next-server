import { AppError, BaseService } from "@/core/index.js";
import { TemplateRepository } from "./repository.js";
import {
  RenderPreviewDTO,
  TemplateListDTO,
  TemplateParam,
  TestSendDTO,
} from "./schema.js";
import {
  parseSmtpConfig,
  sendMailDetailed,
  SmtpConfig,
} from "@/platform/email/service.js";
import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/logger.js";
import { env } from "@/config/env.js";
import { marked } from "marked";
// @ts-ignore
import DOMPurify from "isomorphic-dompurify";
const VAR_REGEX = /\$\{(\w+)\}/g;
interface ChannelPayload {
  title: string;
  /** 纯文本，用于 SMS / Webhook / 日志 */
  text: string;
  /** HTML，用于邮件 */
  html: string;
}
export class TemplateService extends BaseService<TemplateRepository> {
  async renderOptions(tenantId?: string) {
    const list = await this.repository.findAll(tenantId);
    return list.map((t) => ({
      label: t.template_name,
      value: t.template_id,
    }));
  }
  constructor(repository: TemplateRepository) {
    super(repository);
  }
  async renderPreview(dto: RenderPreviewDTO) {
    const renderedTitle = dto.title ? this.render(dto.title, dto.params) : "";
    const renderedContent = this.render(dto.content, dto.params);
    return {
      title: renderedTitle,
      content: renderedContent,
      usedVars: this.extractVars(dto.content),
    };
  }
  private extractVars(content: string): string[] {
    const raw = content ?? "";
    if (!raw) return [];
    const regex = /\$\{(\w+)\}/g;
    const set = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = regex.exec(raw)) !== null) set.add(m[1]);
    return [...set];
  }
  /**
   * 合并参数：用户定义的 + content 派生的
   * - 用户定义的字段（label/type/required/description）优先
   * - content 里出现但用户没定义的，用默认值补上
   */
  private mergeParams(
    content: string,
    userParams: TemplateParam[],
  ): TemplateParam[] {
    const varNames = this.extractVars(content);
    const userMap = new Map(userParams.map((p) => [p.name, p]));

    return varNames.map((name) => {
      const existing = userMap.get(name);
      if (existing) return existing;
      return {
        name,
        label: name,
        type: "string" as const,
        required: false,
      };
    });
  }
  render(template: string, params: Record<string, unknown>): string {
    return template.replace(VAR_REGEX, (_, key: string) => {
      const value = params[key];
      if (value === undefined || value === null) return `\${${key}}`; // 未提供保留原样
      return String(value);
    });
  }
  async testSend(dto: TestSendDTO, tenantId: string, userId: string) {
    const template = await this.repository.findById(dto.templateId, tenantId);
    if (!template) throw new AppError("模板不存在", 404001, 404);

    // ============================================================
    // 1. 校验必填变量
    // ============================================================
    const params = (template.params ?? []) as TemplateParam[];
    const missing: string[] = [];
    for (const p of params) {
      if (
        p.required &&
        (dto.params[p.name] === undefined || dto.params[p.name] === "")
      ) {
        missing.push(p.label ?? p.name);
      }
    }
    if (missing.length > 0) {
      throw new AppError(`缺少必填变量：${missing.join("、")}`, 400001, 400);
    }

    // ============================================================
    // 2. 渲染标题 + 内容（纯文本）
    // ============================================================
    const rawTitle = template.title
      ? this.render(template.title, dto.params)
      : "";
    const rawContent = this.render(template.content, dto.params);
    const format = (template.content_format ?? "markdown") as
      | "markdown"
      | "html"
      | "text";

    // ============================================================
    // 3. 根据渠道处理内容
    // ============================================================
    const payload = this.buildChannelPayload(format, rawTitle, rawContent);

    // ============================================================
    // 4. 落发送日志
    // ============================================================
    const log = await prisma.sys_notice_send_log.create({
      data: {
        tenant_id: tenantId,
        notice_id: null,
        channel_type: template.channel_type,
        receiver: dto.receiver,
        status: "0",
        created_by: userId,
      },
    });

    // ============================================================
    // 5. 按渠道发送
    // ============================================================
    try {
      switch (template.channel_type) {
        case "email": {
          // ⭐ 优先使用租户自定义 SMTP，未配置则回退全局
          const smtp = await this.resolveTenantSmtp(tenantId);

          const result = await sendMailDetailed({
            to: dto.receiver,
            subject: payload.title || `【测试】${template.template_name}`,
            html: payload.html,
            text: payload.text,
            ...(smtp ? { smtp } : {}),
          });

          if (!result.success) {
            throw new AppError(
              `邮件发送失败：${result.error ?? "未知错误"}`,
              500001,
              500,
            );
          }
          break;
        }

        //   case "sms":
        //     await smsService.send(dto.receiver, payload.text);
        //     break;

        //   case "webhook":
        //     await webhookService.send(dto.receiver, {
        //       title: payload.title,
        //       content: payload.text,
        //     });
        //     break;

        //   case "wechat_work":
        //     await wechatService.send(dto.receiver, {
        //       title: payload.title,
        //       content: payload.text,
        //     });
        //     break;

        //   case "dingtalk":
        //     await dingtalkService.send(dto.receiver, {
        //       title: payload.title,
        //       content: payload.text,
        //     });
        //     break;

        default:
          throw new AppError(
            `不支持的渠道：${template.channel_type}`,
            400001,
            400,
          );
      }

      // ============================================================
      // 6. 更新日志状态
      // ============================================================
      await prisma.sys_notice_send_log.update({
        where: { log_id: log.log_id },
        data: { status: "1" },
      });

      logger.info(
        {
          templateId: dto.templateId,
          receiver: dto.receiver,
          channel: template.channel_type,
          format,
        },
        "[template] test sent",
      );

      return {
        success: true,
        title: payload.title,
        content: payload.text, // 返回纯文本给前端展示
        html: payload.html, // 邮件 HTML 可返回用于预览
      };
    } catch (err) {
      await prisma.sys_notice_send_log.update({
        where: { log_id: log.log_id },
        data: {
          status: "0",
          error_msg: err instanceof Error ? err.message : "未知错误",
        },
      });
      throw err;
    }
  }
  private buildChannelPayload(
    format: "markdown" | "html" | "text",
    title: string,
    content: string,
  ): ChannelPayload {
    switch (format) {
      case "html":
        return {
          title,
          text: this.htmlToText(content),
          html: this.sanitizeHtml(content),
        };

      case "markdown":
        return {
          title,
          text: this.markdownToText(content),
          html: this.wrapEmailHtml(title, this.markdownToHtml(content)),
        };

      case "text":
      default:
        return {
          title,
          text: content,
          html: this.wrapEmailHtml(
            title,
            this.escapeHtml(content).replace(/\n/g, "<br/>"),
          ),
        };
    }
  }

  /** Markdown → HTML */
  private markdownToHtml(md: string): string {
    try {
      const raw = marked.parse(md, { breaks: true, gfm: true }) as string;
      return this.sanitizeHtml(raw); // ✅ markdown 渲染后也净化
    } catch {
      return this.escapeHtml(md).replace(/\n/g, "<br/>");
    }
  }

  /** Markdown → 纯文本（去掉语法符号） */
  private markdownToText(md: string): string {
    return md
      .replace(/^#{1,6}\s+/gm, "") // # 标题
      .replace(/\*\*(.+?)\*\*/g, "$1") // **加粗**
      .replace(/\*(.+?)\*/g, "$1") // *斜体*
      .replace(/~~(.+?)~~/g, "$1") // ~~删除线~~
      .replace(/`(.+?)`/g, "$1") // `代码`
      .replace(/!\[.*?\]\(.*?\)/g, "") // ![图片]()
      .replace(/\[(.+?)\]\(.*?\)/g, "$1") // [文字](链接)
      .replace(/^\s*[-*+]\s+/gm, "• ") // - 列表
      .replace(/^\s*\d+\.\s+/gm, "") // 1. 列表
      .replace(/^>\s+/gm, "") // > 引用
      .replace(/^-{3,}$/gm, "") // --- 分割线
      .replace(/\n{3,}/g, "\n\n") // 多空行压缩
      .trim();
  }

  /** HTML → 纯文本 */
  private htmlToText(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  /** HTML 转义 */
  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /** 净化 HTML（可选，用于安全） */
  private sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "em",
        "u",
        "s",
        "del",
        "ins",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "li",
        "blockquote",
        "pre",
        "code",
        "a",
        "img",
        "hr",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "span",
        "div",
      ],
      ALLOWED_ATTR: [
        "href",
        "target",
        "rel",
        "src",
        "alt",
        "title",
        "style",
        "class",
        "width",
        "height",
        "colspan",
        "rowspan",
      ],
      ALLOWED_URI_REGEXP:
        /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
    });
  }

  /**
   * 把邮件正文包装成标准 HTML 邮件模板
   */
  private wrapEmailHtml(title: string, bodyHtml: string): string {
    const appName = env.APP_NAME ?? "系统";
    const safeTitle = title ? this.escapeHtml(title) : "";

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          ${
            safeTitle
              ? `<tr>
                   <td style="padding:32px 32px 0;">
                     <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#0f172a;line-height:1.4;">
                       ${safeTitle}
                     </h1>
                   </td>
                 </tr>`
              : ""
          }
          <tr>
            <td style="padding:${safeTitle ? "0" : "32px"} 32px 32px;font-size:14px;line-height:1.7;color:#334155;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;border-top:1px solid #e2e8f0;">
              <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;text-align:center;">
                ${this.escapeHtml(appName)} · 系统自动发送，请勿回复
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
  private async resolveTenantSmtp(
    tenantId: string,
  ): Promise<SmtpConfig | null> {
    const channel = await prisma.sys_notice_channel.findFirst({
      where: {
        tenant_id: tenantId,
        channel_type: "email",
        is_deleted: 0,
      },
    });

    if (!channel || channel.enabled !== 1 || !channel.config) return null;

    try {
      const raw = JSON.parse(channel.config) as Record<string, unknown>;
      const smtp = parseSmtpConfig(raw);
      if (!smtp) {
        logger.warn({ tenantId }, "[template] 租户邮件配置无效，回退全局 SMTP");
        return null;
      }
      return smtp;
    } catch (err) {
      logger.error(
        { err, tenantId },
        "[template] 解析租户邮件配置失败，回退全局 SMTP",
      );
      return null;
    }
  }
}
