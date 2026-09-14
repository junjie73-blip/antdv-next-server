import { NoticeChannel, SendContext, SendResult } from "./base.js";
import { inAppChannel } from "./in-app.js";
import { emailChannel } from "./email.js";
import { smsChannel } from "./sms.js";
import { webhookChannel } from "./webhook.js";
import { prisma } from "@/config/database.js";
import { logger } from "@core/logger/index.js";

const REGISTRY: Record<string, NoticeChannel> = {
  in_app: inAppChannel,
  email: emailChannel,
  sms: smsChannel,
  webhook: webhookChannel,
};

export function getChannel(type: string): NoticeChannel | null {
  return REGISTRY[type] ?? null;
}

export interface DispatchInput {
  tenantId: string;
  noticeId?: string;
  title: string;
  content?: string;
  channels?: string[];
  receiversByChannel?: Record<string, string[]>;
}

export async function dispatchNotice(
  input: DispatchInput,
): Promise<SendResult[]> {
  const { tenantId, noticeId, title, content } = input;

  // 1) 查租户渠道配置
  const enabled = await prisma.sys_notice_channel.findMany({
    where: { tenant_id: tenantId, enabled: 1, is_deleted: 0 },
  });

  // ⭐ 站内信隐式启用：未配置 → 默认启用
  const hasInAppConfig = enabled.some((c) => c.channel_type === "in_app");
  const implicitInApp =
    !hasInAppConfig ||
    enabled.some((c) => c.channel_type === "in_app" && c.enabled === 1);

  const selectedList = [
    ...(implicitInApp ? [{ channel_type: "in_app", config: null } as any] : []),
    ...(input.channels
      ? enabled.filter((c) => input.channels!.includes(c.channel_type))
      : enabled.filter((c) => c.channel_type !== "in_app")),
  ];

  // 去重
  const seen = new Set<string>();
  const selected = selectedList.filter((c) => {
    if (seen.has(c.channel_type)) return false;
    seen.add(c.channel_type);
    return true;
  });

  if (selected.length === 0) return [];

  // 2) 收件人推导
  let fallbackReceivers: Record<string, string[]> = {};
  if (!input.receiversByChannel && noticeId) {
    const targets = await prisma.sys_notice_user.findMany({
      where: { notice_id: noticeId, tenant_id: tenantId },
      select: { user_id: true },
    });
    const userIds = targets.map((t) => t.user_id);
    if (userIds.length > 0) {
      const users = await prisma.sys_user.findMany({
        where: { user_id: { in: userIds }, tenant_id: tenantId, is_deleted: 0 },
        select: { email: true, phone: true },
      });
      fallbackReceivers = {
        email: users.map((u) => u.email).filter(Boolean) as string[],
        sms: users.map((u) => u.phone).filter(Boolean) as string[],
      };
    }
  }

  const results: SendResult[] = [];

  for (const ch of selected) {
    const impl = getChannel(ch.channel_type);
    if (!impl) {
      logger.warn({ type: ch.channel_type }, "[notice] channel not registered");
      continue;
    }
    const cfg = ch.config ? safeParse(ch.config) : {};
    if (!impl.isReady(cfg)) {
      logger.warn({ type: ch.channel_type }, "[notice] channel not ready");
      continue;
    }

    const receivers =
      input.receiversByChannel?.[ch.channel_type] ??
      fallbackReceivers[ch.channel_type] ??
      (ch.channel_type === "webhook" && cfg.url ? [cfg.url] : []);

    if (receivers.length === 0 && ch.channel_type !== "in_app") continue;

    const result = await impl.send({
      tenantId,
      noticeId,
      title,
      content,
      receivers,
      config: cfg,
    });
    results.push(result);

    // ⭐ 写日志：区分成功 / 失败
    const logs: any[] = [];
    if (result.errors.length > 0) {
      result.errors.forEach((e) => {
        logs.push({
          tenant_id: tenantId,
          notice_id: noticeId ?? null,
          channel_type: ch.channel_type,
          receiver: e.receiver,
          status: "0",
          error_msg: e.reason,
        });
      });
    }
    if (result.success > 0) {
      logs.push({
        tenant_id: tenantId,
        notice_id: noticeId ?? null,
        channel_type: ch.channel_type,
        receiver: "*",
        status: "1",
      });
    }
    if (logs.length > 0) {
      try {
        await prisma.sys_notice_send_log.createMany({ data: logs });
      } catch (err) {
        logger.error({ err }, "[notice] write send-log failed");
      }
    }
  }

  return results;
}

function safeParse(s: string): Record<string, any> {
  try {
    return JSON.parse(s);
  } catch (err) {
    logger.warn({ err, raw: s.slice(0, 200) }, "[notice] config parse failed");
    return {};
  }
}
