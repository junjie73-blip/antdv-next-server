import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";
import { sendMailDetailed } from "@/platform/email/service.js";
import { describeUa } from "../ua-fingerprint.js";
import { ABNORMAL_TYPE } from "../constants.js";
import type { DetectResult, LoginContext } from "../types.js";
import { messagePushService } from "../../message/service/message-push.service.js";

const TYPE_LABEL: Record<string, string> = {
  [ABNORMAL_TYPE.NEW_IP]: "新 IP 登录",
  [ABNORMAL_TYPE.NEW_DEVICE]: "新设备登录",
  [ABNORMAL_TYPE.IMPOSSIBLE_TRAVEL]: "异地异常登录",
  [ABNORMAL_TYPE.UNUSUAL_TIME]: "异常时段登录",
};

/**
 * 异常登录通知
 * - 站内信（message-center）
 * - 邮件（如果用户绑定了邮箱）
 */
export class LoginSecurityNotification {
  async notifyAbnormal(ctx: LoginContext, result: DetectResult): Promise<void> {
    if (!result.isAbnormal) return;

    const user = await prisma.sys_user.findFirst({
      where: {
        user_id: ctx.userId,
        tenant_id: ctx.tenantId,
        is_deleted: 0,
      },
      select: { email: true, real_name: true, username: true },
    });
    if (!user) return;

    const typeLabel = TYPE_LABEL[result.type ?? ""] ?? "异常登录";
    const ua = describeUa(ctx.userAgent);
    const location =
      [result.geo.country, result.geo.province, result.geo.city]
        .filter(Boolean)
        .join(" ") || "未知";

    const time = ctx.loginAt.toLocaleString("zh-CN");

    const title = `【安全提醒】${typeLabel}`;
    const content = [
      `时间：${time}`,
      `IP：${ctx.ip}（${location}）`,
      `设备：${ua.browser} / ${ua.os}`,
      `原因：${result.reason ?? typeLabel}`,
      ``,
      `如非本人操作，请立即：`,
      `1. 修改登录密码`,
      `2. 检查账号安全设置`,
      `3. 联系系统管理员`,
    ].join("\n");

    // 1. 站内信
    try {
      await messagePushService.push({
        tenantId: ctx.tenantId,
        userIds: [ctx.userId],
        bizType: "system",
        bizId: null,
        title,
        content,
        priority: 2,
      });
    } catch (err) {
      logger.error(
        { err, userId: ctx.userId },
        "[login-security] push message failed",
      );
    }

    // 2. 邮件（异步，失败不影响）
    if (user.email) {
      try {
        await sendMailDetailed({
          to: user.email,
          subject: title,
          text: content,
          html: `<pre style="font-family:inherit;white-space:pre-wrap">${escapeHtml(content)}</pre>`,
        });
      } catch (err) {
        logger.warn(
          { err, userId: ctx.userId },
          "[login-security] email notify failed",
        );
      }
    }

    logger.info(
      { userId: ctx.userId, type: result.type, ip: ctx.ip },
      "[login-security] abnormal login notified",
    );
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const loginSecurityNotification = new LoginSecurityNotification();
