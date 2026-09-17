interface TemplateInput {
  title: string;
  content?: string;
  noticeType?: number | string;
  publishTime?: string | Date;
  actionUrl?: string;
  /** 系统名，默认「通知中心」 */
  systemName?: string;
  /** 品牌色，默认近黑。有 VI 色就传，比如 "#1E40AF" */
  brandColor?: string;
  /** 收件人名称，可选 */
  receiverName?: string;
}

const TYPE_MAP: Record<string, { label: string; en: string }> = {
  "1": { label: "通知", en: "NOTICE" },
  "2": { label: "公告", en: "ANNOUNCEMENT" },
  "3": { label: "提醒", en: "REMINDER" },
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isHtml(s: string): boolean {
  return /<[a-z][\s\S]*>/i.test(s);
}

function renderContent(content?: string): string {
  if (!content) return "";
  if (isHtml(content)) return content;
  return escapeHtml(content)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

function fmtTime(t?: string | Date): string {
  const d = t ? (t instanceof Date ? t : new Date(t)) : new Date();
  if (isNaN(d.getTime())) return String(t ?? "");
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif";
const MONO = "ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace";

export function renderNoticeEmail(input: TemplateInput): string {
  const {
    title,
    content,
    noticeType,
    publishTime,
    actionUrl,
    systemName = "通知中心",
    brandColor = "#0F172A",
    receiverName,
  } = input;

  const t = TYPE_MAP[String(noticeType ?? "1")] ?? TYPE_MAP["1"];
  const safeTitle = escapeHtml(title);
  const bodyHtml = renderContent(content);
  const time = fmtTime(publishTime);
  const safeSystem = escapeHtml(systemName);
  const greeting = receiverName ? `${escapeHtml(receiverName)}，你好` : "";
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light only"/>
<title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:#F4F5F7;font-family:${FONT};-webkit-font-smoothing:antialiased;">
  <div style="display:none;font-size:0;line-height:0;max-height:0;overflow:hidden;opacity:0;">
    ${safeTitle} · ${t.label}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4F5F7;">
    <tr>
      <td align="center" style="padding:48px 16px 64px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- 卡片 -->
          <tr>
            <td style="background:#FFFFFF;border-radius:14px;border:1px solid #E8EAED;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,0.04),0 8px 24px -12px rgba(15,23,42,0.08);">

              <!-- 顶部极窄品牌条 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="height:3px;background:${brandColor};line-height:3px;font-size:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- 品牌区 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:28px 40px 24px;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td style="vertical-align:middle;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="vertical-align:middle;padding-right:10px;">
                                <div style="width:22px;height:22px;background:${brandColor};border-radius:6px;line-height:22px;text-align:center;color:#FFFFFF;font-size:11px;font-weight:700;font-family:${FONT};">N</div>
                              </td>
                              <td style="vertical-align:middle;font-size:14px;font-weight:600;color:#0F172A;letter-spacing:0.2px;">
                                ${safeSystem}
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td align="right" style="vertical-align:middle;font-size:12px;color:#94A3B8;font-family:${MONO};letter-spacing:-0.2px;">
                          ${time}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- 主内容区 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:8px 40px 40px;">

                    <!-- 类型标签 -->
                    <div style="font-size:11px;font-weight:600;color:#94A3B8;letter-spacing:1.5px;text-transform:uppercase;font-family:${FONT};margin-bottom:14px;">
                      ${t.en}
                    </div>

                    <!-- ⭐ 标题 + 左侧品牌竖线 -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
                      <tr>
                        <td style="vertical-align:top;padding-right:14px;">
                          <div style="width:3px;height:30px;background:${brandColor};border-radius:2px;margin-top:4px;line-height:0;font-size:0;">&nbsp;</div>
                        </td>
                        <td style="vertical-align:top;">
                          <h1 style="margin:0;font-size:26px;line-height:1.35;font-weight:700;color:#0F172A;letter-spacing:-0.4px;font-family:${FONT};">
                            ${safeTitle}
                          </h1>
                        </td>
                      </tr>
                    </table>

                    <!-- 分隔线 -->
                    <div style="height:1px;background:#EEF0F3;line-height:1px;font-size:0;margin-bottom:28px;">&nbsp;</div>

                    <!-- 正文 -->
                    <div style="font-size:15px;line-height:1.8;color:#475569;font-family:${FONT};">
                      ${greeting ? `<p style="margin:0 0 16px;color:#0F172A;font-weight:500;">${greeting}</p>` : ""}
                      ${bodyHtml || `<p style="margin:0;color:#94A3B8;">（无正文内容）</p>`}
                    </div>

                    ${
                      actionUrl
                        ? `
                    <!-- 按钮 -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;">
                      <tr>
                        <td style="background:${brandColor};border-radius:8px;">
                          <a href="${actionUrl}" target="_blank"
                             style="display:inline-block;padding:12px 24px;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.2px;font-family:${FONT};">
                            查看详情 →
                          </a>
                        </td>
                      </tr>
                    </table>`
                        : ""
                    }

                  </td>
                </tr>
              </table>

              <!-- 页脚区（浅灰背景，与正文区分离） -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#FAFBFC;border-top:1px solid #EEF0F3;padding:20px 40px;">
                    <div style="font-size:12px;line-height:1.75;color:#94A3B8;font-family:${FONT};">
                      本邮件由 ${safeSystem} 自动发送，请勿直接回复。<br/>
                      如需帮助，请登录系统查看或联系管理员。
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- 卡片外页脚 -->
          <tr>
            <td style="padding:20px 8px 0;text-align:center;font-size:11px;color:#B0B7C3;letter-spacing:0.3px;font-family:${FONT};">
              © ${year} ${safeSystem} · All rights reserved
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
