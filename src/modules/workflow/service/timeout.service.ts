import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";
import { wfNotificationService } from "./notification.service.js";
import { AssigneeResolver } from "./assignee-resolver.js";
import { WfTaskTransferRepository } from "../repository/task-transfer.repository.js";

const MAX_SCAN = 1000;

export class WfTimeoutService {
  private logRepo = new WfTaskTransferRepository();

  /**
   * 扫描超时任务并升级
   * 由 scheduler 每分钟调用
   */
  async scanAndEscalate(): Promise<{
    scanned: number;
    escalated: number;
    skipped: number;
  }> {
    const now = new Date();

    const tasks = await prisma.wf_task.findMany({
      where: {
        status: "0",
        is_deleted: 0,
        due_at: { lte: now },
        // 已通知过的跳过
        OR: [
          { escalated_at: null },
          // 距离上次升级超过 30 分钟才允许再升一级
          { escalated_at: { lt: new Date(now.getTime() - 30 * 60_000) } },
        ],
      },
      take: MAX_SCAN,
      orderBy: { due_at: "asc" },
    });

    let escalated = 0;
    let skipped = 0;

    for (const task of tasks) {
      try {
        const instance = await prisma.wf_instance.findUnique({
          where: { instance_id: task.instance_id },
          select: {
            def_id: true,
            def_key: true,
            initiator_id: true,
            initiator_dept_id: true,
            variables: true,
          },
        });
        if (!instance) {
          skipped++;
          continue;
        }

        const def = await prisma.wf_definition.findUnique({
          where: { def_id: instance.def_id },
          select: { definition: true },
        });
        const definition = def?.definition as any;
        if (!definition) {
          skipped++;
          continue;
        }

        const node = definition.nodes?.find((n: any) => n.id === task.node_id);
        if (!node?.timeout) {
          skipped++;
          continue;
        }

        const { action, escalateTo, maxEscalateLevel = 3 } = node.timeout;

        // 只处理 escalate 动作
        if (action !== "escalate") {
          // 其他动作（notify / autoApprove / autoReject）由原逻辑处理
          skipped++;
          continue;
        }

        // 超过最大升级次数 → 停止
        if ((task.escalation_level ?? 0) >= maxEscalateLevel) {
          skipped++;
          continue;
        }

        // 计算升级目标
        const targetIds = await this.resolveEscalateTarget(escalateTo, {
          tenantId: task.tenant_id,
          instanceId: task.instance_id,
          initiatorId: instance.initiator_id,
          initiatorDeptId: instance.initiator_dept_id,
          variables: instance.variables as any,
          defKey: instance.def_key,
        });

        if (targetIds.length === 0) {
          logger.warn(
            { taskId: task.task_id, escalateTo },
            "[wf-timeout] 升级目标解析为空",
          );
          skipped++;
          continue;
        }

        // 转派给第一个目标
        const targetUserId = targetIds[0];
        const level = (task.escalation_level ?? 0) + 1;

        await prisma.$transaction([
          prisma.wf_task.update({
            where: { task_id: task.task_id },
            data: {
              assignee_id: targetUserId,
              escalation_level: level,
              escalated_at: now,
              escalated_to: targetUserId,
              // 已转办记录
              transferred_from_id: task.assignee_id,
              transferred_at: now,
              // 延长 due_at（给升级人多一点时间）
              due_at: new Date(now.getTime() + 30 * 60_000),
            },
          }),
        ]);

        // 写日志
        await this.logRepo.log({
          tenantId: task.tenant_id,
          taskId: task.task_id,
          instanceId: task.instance_id,
          actionType: "escalate",
          fromUserId: task.assignee_id,
          toUserId: targetUserId,
          operatorId: "system",
          reason: `超时自动升级（第 ${level} 级）`,
          metadata: { escalationLevel: level, escalateTo },
        });

        // 写历史
        await prisma.wf_history.create({
          data: {
            tenant_id: task.tenant_id,
            instance_id: task.instance_id,
            node_id: task.node_id,
            node_name: task.node_name,
            node_type: task.node_type,
            event_type: "escalate",
            operator_id: "system",
            comment: `超时升级到用户 ${targetUserId}`,
            variables: { escalationLevel: level } as any,
          },
        });

        // 通知新审批人
        void wfNotificationService
          .notify({
            tenantId: task.tenant_id,
            instanceId: task.instance_id,
            taskId: task.task_id,
            nodeId: task.node_id,
            eventType: "assign",
            receiverIds: [targetUserId],
            extra: { reason: "超时升级" },
          })
          .catch(() => undefined);

        escalated++;

        logger.info(
          { taskId: task.task_id, level, targetUserId },
          "[wf-timeout] 升级成功",
        );
      } catch (err) {
        logger.error({ err, taskId: task.task_id }, "[wf-timeout] 升级失败");
        skipped++;
      }
    }

    return { scanned: tasks.length, escalated, skipped };
  }

  private async resolveEscalateTarget(
    config: any,
    ctx: {
      tenantId: string;
      instanceId: string;
      initiatorId: string;
      initiatorDeptId: string | null;
      variables: Record<string, any>;
      defKey: string;
    },
  ): Promise<string[]> {
    if (!config || !config.type) return [];

    const fullCtx = {
      tenantId: ctx.tenantId,
      instanceId: ctx.instanceId,
      initiatorId: ctx.initiatorId,
      initiatorDeptId: ctx.initiatorDeptId,
      variables: ctx.variables,
      defKey: ctx.defKey,
    };

    switch (config.type) {
      case "deptLeader":
        return AssigneeResolver.resolve(
          { type: "deptLeader", level: config.level ?? 1 },
          fullCtx,
        );
      case "initiatorLeader":
        // 发起人的部门领导
        return AssigneeResolver.resolve(
          { type: "deptLeader", level: config.level ?? 1 },
          { ...fullCtx, initiatorId: ctx.initiatorId },
        );
      case "user":
        return AssigneeResolver.resolve(
          { type: "user", value: config.value },
          fullCtx,
        );
      case "role":
        return AssigneeResolver.resolve(
          { type: "role", value: config.value },
          fullCtx,
        );
      default:
        return [];
    }
  }
}

export const wfTimeoutService = new WfTimeoutService();
