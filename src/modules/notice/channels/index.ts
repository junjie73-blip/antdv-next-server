import { NoticeChannel, SendContext, SendResult } from "./base.js";
import { inAppChannel } from "./in-app.js";
import { emailChannel } from "./email.js";
import { smsChannel } from "./sms.js";
import { webhookChannel } from "./webhook.js";
import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";
import { sendAlert } from "@/platform/alert/index.js";
import { redis } from "@/config/redis.js";

const channelFailureCounter = new Map<string, number>();
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
  templateId?: string;
}
const FAIL_TTL = 24 * 3600;
const FAIL_THRESHOLD = 5;
export async function dispatchNotice(
  input: DispatchInput,
): Promise<SendResult[]> {
  const { tenantId, noticeId, title, content } = input;
  let templateInfo: SendContext["template"] | undefined;
  let receiverMeta: SendContext["receiverMeta"] = {};
  let templateId = input.templateId;
  if (!templateId && noticeId) {
    const notice = await prisma.sys_notice.findFirst({
      where: { notice_id: noticeId, tenant_id: tenantId, is_deleted: 0 },
      select: { template_id: true },
    });
    templateId = notice?.template_id ?? undefined;
  }

  if (templateId) {
    const tpl = await prisma.sys_notice_template.findFirst({
      where: { template_id: templateId, tenant_id: tenantId, is_deleted: 0 },
      select: {
        template_id: true,
        title: true,
        content: true,
        content_format: true,
        status: true,
      },
    });
    if (tpl && tpl.status === "1") {
      templateInfo = {
        templateId: tpl.template_id,
        title: tpl.title,
        content: tpl.content,
        contentFormat: tpl.content_format ?? "markdown",
      };
    } else if (tpl && tpl.status !== "1") {
      logger.warn(
        { templateId, tenantId },
        "[notice] 关联的模板已停用，回退默认模板",
      );
    } else if (!tpl) {
      logger.warn(
        { templateId, tenantId },
        "[notice] 关联的模板不存在，回退默认模板",
      );
    }
  }
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
        select: {
          user_id: true,
          username: true,
          real_name: true,
          email: true,
          phone: true,
          sys_user_dept: {
            where: { is_primary: 1 },
            select: { dept: { select: { dept_name: true } } },
          },
        },
      });
      fallbackReceivers = {
        email: users.map((u) => u.email).filter(Boolean) as string[],
        sms: users.map((u) => u.phone).filter(Boolean) as string[],
      };
      for (const u of users) {
        const meta = {
          userName: u.username,
          realName: u.real_name ?? u.username,
          deptName: u.sys_user_dept?.[0]?.dept?.dept_name ?? "",
        };
        if (u.email) receiverMeta![u.email] = meta;
        if (u.phone) receiverMeta![u.phone] = meta;
      }
    }
  }

  const results: SendResult[] = [];

  for (const ch of selected) {
    const impl = getChannel(ch.channel_type);
    if (!impl) {
      results.push(skipResult(ch.channel_type, "channel not registered"));
      continue;
    }
    const cfg = ch.config ? safeParse(ch.config) : {};
    if (!impl.isReady(cfg)) {
      results.push(skipResult(ch.channel_type, "channel not ready"));
      continue;
    }

    const receivers =
      input.receiversByChannel?.[ch.channel_type] ??
      fallbackReceivers[ch.channel_type] ??
      (ch.channel_type === "webhook" && cfg.url ? [cfg.url] : []);

    if (receivers.length === 0 && ch.channel_type !== "in_app") {
      results.push(skipResult(ch.channel_type, "no receivers"));
      continue;
    }

    const result = await impl.send({
      tenantId,
      noticeId,
      title,
      content,
      receivers,
      config: cfg,
      template: templateInfo,
      receiverMeta,
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
    if (result.failed > 0) {
      const key = `notice:channel-fail:${tenantId}:${ch.channel_type}`;
      try {
        const count = await redis.incr(key);
        if (count === 1) {
          await redis.expire(key, FAIL_TTL, "NX").catch(() => {});
        }
        if (count >= FAIL_THRESHOLD) {
          void sendAlert({
            level: "warning",
            title: `notice_channel_failure:${tenantId}:${ch.channel_type}`,
            message: `通知渠道「${ch.channel_type}」连续失败 ${count} 次`,
            source: "notice",
            data: { tenantId, channel: ch.channel_type, failed: result.failed },
          });
          await redis.del(key); // 重置
        }
      } catch (e) {
        logger.warn({ e }, "[notice] channel fail counter error");
      }
    } else if (result.success > 0) {
      const key = `notice:channel-fail:${tenantId}:${ch.channel_type}`;
      await redis.del(key).catch(() => {});
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
function skipResult(channel: string, reason: string): SendResult {
  return {
    channel,
    total: 0,
    success: 0,
    failed: 0,
    skipped: true, // ⭐ 前端可区分“跳过”和“成功 0”
    errors: [{ receiver: "*", reason }],
  } as SendResult;
}
