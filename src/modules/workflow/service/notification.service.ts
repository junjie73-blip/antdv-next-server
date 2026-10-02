import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";
import { wfNotifyQueue } from "@/platform/queue/queues.js";
import { WfEventType, WfNotifyParams } from "../types.js";
import { messagePushService } from "@/modules/message/service/message-push.service.js";
import { publishWorkflowNotify } from "@/platform/ws/index.js";

const TEMPLATE_MAP: Record<WfEventType, { title: string; template: string }> = {
  assign: {
    title: "【待办】{{instanceTitle}}",
    template:
      "您有一条新的待办任务：{{instanceTitle}}\n节点：{{nodeName}}\n发起人：{{initiatorName}}",
  },
  complete: {
    title: "【已办】{{instanceTitle}}",
    template: "您审批的「{{instanceTitle}}」已通过。",
  },
  reject: {
    title: "【驳回】{{instanceTitle}}",
    template: "您审批的「{{instanceTitle}}」已被驳回。\n原因：{{comment}}",
  },
  timeout: {
    title: "【超时】{{instanceTitle}}",
    template: "您有一条待办任务已超时：{{instanceTitle}}\n节点：{{nodeName}}",
  },
  terminate: {
    title: "【终止】{{instanceTitle}}",
    template: "流程「{{instanceTitle}}」已终止。\n原因：{{reason}}",
  },
  cc: {
    title: "【抄送】{{instanceTitle}}",
    template: "您收到一份抄送：{{instanceTitle}}",
  },
  start: {
    title: "【发起】{{instanceTitle}}",
    template: "流程「{{instanceTitle}}」已发起。",
  },
};

export class WfNotificationService {
  async notifyCc(params: {
    tenantId: string;
    instanceId: string;
    nodeId: string;
    nodeName: string;
    receiverIds: string[];
    title: string;
    content: string;
    realtime: boolean;
    pushMessage: boolean;
  }): Promise<void> {
    if (params.receiverIds.length === 0) return;

    // 1) 实时推送（走 workflow ws channel）
    if (params.realtime) {
      for (const userId of params.receiverIds) {
        await publishWorkflowNotify({
          userId,
          tenantId: params.tenantId,
          instanceId: params.instanceId,
          nodeId: params.nodeId,
          eventType: "cc",
          title: params.title,
          content: params.content,
        }).catch((err) => {
          logger.warn(
            { err, userId, instanceId: params.instanceId },
            "[wf-notify] cc ws push failed",
          );
        });
      }
    }

    // 2) 消息中心
    if (params.pushMessage) {
      await messagePushService
        .push({
          tenantId: params.tenantId,
          userIds: params.receiverIds,
          bizType: "workflow",
          bizId: params.instanceId,
          title: params.title,
          content: params.content,
          priority: 0,
          realtime: false, // 上面已经 WS 推了，避免重复
        })
        .catch((err) => {
          logger.warn(
            { err, instanceId: params.instanceId },
            "[wf-notify] cc message push failed",
          );
        });
    }

    logger.debug(
      {
        instanceId: params.instanceId,
        nodeId: params.nodeId,
        count: params.receiverIds.length,
      },
      "[wf-notify] cc done",
    );
  }
  async notifyStart(params: {
    tenantId: string;
    instanceId: string;
    initiatorId: string;
  }): Promise<void> {
    return this.notify({
      tenantId: params.tenantId,
      instanceId: params.instanceId,
      eventType: "start",
      receiverIds: [params.initiatorId],
    });
  }

  /** ⭐ 流程完成时通知发起人 */
  async notifyComplete(params: {
    tenantId: string;
    instanceId: string;
    initiatorId: string;
    result: "approved" | "rejected";
    comment?: string;
  }): Promise<void> {
    return this.notify({
      tenantId: params.tenantId,
      instanceId: params.instanceId,
      eventType: params.result === "approved" ? "complete" : "reject",
      receiverIds: [params.initiatorId],
      extra: { comment: params.comment ?? "" },
    });
  }
  async notify(params: WfNotifyParams): Promise<void> {
    if (!params.receiverIds?.length) return;

    try {
      const instance = await prisma.wf_instance.findUnique({
        where: { instance_id: params.instanceId },
        select: {
          title: true,
          def_key: true,
          initiator_id: true,
          variables: true,
        },
      });
      if (!instance) return;

      const initiator = await prisma.sys_user.findUnique({
        where: { user_id: instance.initiator_id },
        select: { real_name: true, username: true },
      });
      const initiatorName =
        initiator?.real_name ?? initiator?.username ?? "未知";

      // 查节点名
      let nodeName = "";
      if (params.nodeId) {
        const def = await prisma.wf_definition.findFirst({
          where: {
            tenant_id: params.tenantId,
            def_key: instance.def_key,
            status: "1",
            is_deleted: 0,
          },
          select: { definition: true },
          orderBy: { version: "desc" },
        });
        const nodes = ((def?.definition as any)?.nodes ?? []) as Array<{
          id: string;
          name?: string;
        }>;
        nodeName =
          nodes.find((n) => n.id === params.nodeId)?.name ?? params.nodeId;
      }

      const tpl = TEMPLATE_MAP[params.eventType];
      const vars: Record<string, any> = {
        instanceTitle: instance.title,
        defKey: instance.def_key,
        initiatorName,
        nodeName,
        ...(instance.variables as Record<string, any>),
        ...(params.extra ?? {}),
      };

      const title = this.render(tpl.title, vars);
      const content = this.render(tpl.template, vars);

      await wfNotifyQueue.add(
        "notify",
        {
          tenantId: params.tenantId,
          instanceId: params.instanceId,
          taskId: params.taskId,
          nodeId: params.nodeId,
          eventType: params.eventType,
          receiverIds: [...new Set(params.receiverIds)],
          title,
          content,
        },
        {
          jobId: `wf-notify-${params.eventType}-${params.taskId ?? params.instanceId}-${Date.now()}`,
        },
      );
    } catch (err: any) {
      logger.error(
        { err, instanceId: params.instanceId, eventType: params.eventType },
        "[wf-notify] 入队失败",
      );
    }
  }

  private render(template: string, vars: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
      vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : "",
    );
  }
}

export const wfNotificationService = new WfNotificationService();
