import { Worker } from "bullmq";
import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";
import { publishWorkflowNotify } from "@/platform/ws/index.js";
import {
  wfNotificationTotal,
  wfNotificationDuration,
} from "@/platform/metrics/workflow-notify.js";
import { dispatchNotice } from "@/modules/notice/channels/index.js";
import { createBullConnection } from "@/config/redis.js";

interface WfNotifyJobData {
  tenantId: string;
  instanceId: string;
  taskId?: string;
  nodeId?: string;
  eventType: string;
  receiverIds: string[];
  title: string;
  content: string;
}

export const wfNotifyWorker = new Worker<WfNotifyJobData>(
  "wf-notify",
  async (job) => {
    const data = job.data;
    const start = Date.now();

    // 1. 查用户
    const users = await prisma.sys_user.findMany({
      where: {
        user_id: { in: data.receiverIds },
        tenant_id: data.tenantId,
        is_deleted: 0,
        status: "1",
      },
      select: {
        user_id: true,
        username: true,
        real_name: true,
        email: true,
        phone: true,
      },
    });

    if (users.length === 0) {
      logger.warn(
        { instanceId: data.instanceId, receiverIds: data.receiverIds },
        "[wf-notify] 未找到有效接收人",
      );
      return;
    }

    /* ============================================================
     * 2. ⭐ WS 实时推送（每个接收人一条）
     * ============================================================ */
    const wsStart = Date.now();
    for (const user of users) {
      await publishWorkflowNotify({
        userId: user.user_id,
        tenantId: data.tenantId,
        instanceId: data.instanceId,
        taskId: data.taskId,
        nodeId: data.nodeId,
        eventType: data.eventType as any,
        title: data.title,
        content: data.content,
        bizSource: data.instanceId.startsWith("i-") ? "workflow" : "approval",
      }).catch((err) => {
        logger.warn(
          { err, userId: user.user_id, eventType: data.eventType },
          "[wf-notify] WS 推送失败",
        );
      });
    }

    logger.debug(
      {
        count: users.length,
        duration: Date.now() - wsStart,
        eventType: data.eventType,
      },
      "[wf-notify] WS 推送完成",
    );

    /* ============================================================
     * 3. 邮件/短信（复用现有渠道）
     * ============================================================ */
    const emailReceivers = users
      .map((u) => u.email)
      .filter(Boolean) as string[];
    const smsReceivers = users.map((u) => u.phone).filter(Boolean) as string[];

    const channelResults = await dispatchNotice({
      tenantId: data.tenantId,
      title: data.title,
      content: data.content,
      channels: ["email", "sms"],
      receiversByChannel: {
        email: emailReceivers,
        sms: smsReceivers,
      },
    });

    // 4. 埋点：按渠道统计
    for (const r of channelResults) {
      if (r.skipped) continue;

      wfNotificationTotal
        .labels(
          data.tenantId,
          data.eventType,
          r.channel,
          r.failed > 0 ? "failed" : "success",
        )
        .inc(r.total);

      wfNotificationDuration
        .labels(r.channel, "dispatch")
        .observe((Date.now() - start) / 1000);
    }

    logger.info(
      {
        instanceId: data.instanceId,
        eventType: data.eventType,
        userCount: users.length,
        channels: channelResults.map((r) => r.channel),
        duration: Date.now() - start,
      },
      "[wf-notify] 完成",
    );

    return { userCount: users.length, channels: channelResults };
  },
  {
    connection: createBullConnection("wf-notify"),
    concurrency: 5,
    limiter: { max: 50, duration: 1000 },
  },
);

export default wfNotifyWorker;
