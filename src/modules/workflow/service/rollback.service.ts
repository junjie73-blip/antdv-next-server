import { prisma } from "@/config/database.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { WfTaskTransferRepository } from "../repository/task-transfer.repository.js";
import { wfNotificationService } from "./notification.service.js";

export class WfRollbackService {
  private logRepo = new WfTaskTransferRepository();

  /**
   * 回退任务到上一节点
   * @param targetNodeId 目标节点 ID（必须是当前节点的上游节点）
   */
  async rollback(
    taskId: string,
    tenantId: string,
    operatorId: string,
    params: {
      targetNodeId?: string; // 不传 → 自动找上一节点
      reason: string;
    },
  ): Promise<void> {
    // 1. 加载任务
    const task = await prisma.wf_task.findFirst({
      where: { task_id: taskId, tenant_id: tenantId, is_deleted: 0 },
    });
    if (!task) throw new AppError("任务不存在", 404001, 404);
    if (task.status !== "0") {
      throw new AppError("任务已完成，无法回退", 400001, 400);
    }

    // 2. 权限
    const candidates = (task.candidate_ids as string[]) ?? [];
    if (task.assignee_id !== operatorId && !candidates.includes(operatorId)) {
      throw new AppError("您无权回退此任务", 403001, 403);
    }

    // 3. 加载实例
    const instance = await prisma.wf_instance.findUnique({
      where: { instance_id: task.instance_id },
    });
    if (!instance) throw new AppError("流程实例不存在", 404001, 404);
    if (instance.status !== "0" && instance.status !== "3") {
      throw new AppError("流程已结束，无法回退", 400002, 400);
    }

    // 4. 加载定义
    const def = await prisma.wf_definition.findUnique({
      where: { def_id: instance.def_id },
    });
    const definition = def?.definition as any;

    // 5. 计算目标节点
    const targetNodeId =
      params.targetNodeId ?? this.findPreviousNode(task.node_id, definition);
    if (!targetNodeId) {
      throw new AppError("无法找到上一节点", 400001, 400);
    }

    // 6. 校验目标节点合法
    const targetNode = definition?.nodes?.find(
      (n: any) => n.id === targetNodeId,
    );
    if (!targetNode) throw new AppError("目标节点不存在", 400001, 400);
    if (
      targetNode.type !== "userTask" &&
      targetNode.type !== "countersignTask" &&
      targetNode.type !== "orSignTask"
    ) {
      throw new AppError("目标节点不是审批节点，无法回退", 400001, 400);
    }

    // 7. 查找目标节点上一个完成的任务（获取原审批人）
    const previousTasks = await prisma.wf_task.findMany({
      where: {
        instance_id: task.instance_id,
        node_id: targetNodeId,
        tenant_id: tenantId,
        is_deleted: 0,
      },
      orderBy: { created_at: "desc" },
      take: 1,
    });

    if (previousTasks.length === 0) {
      throw new AppError("找不到目标节点的历史任务，无法回退", 400001, 400);
    }

    const previousTask = previousTasks[0];

    // 8. 事务：软删当前+后续节点任务 → 新建或复用目标任务
    await prisma.$transaction(async (tx) => {
      // 8.1 取消当前节点及下游所有活跃任务
      await tx.wf_task.updateMany({
        where: {
          instance_id: task.instance_id,
          tenant_id: tenantId,
          status: "0",
          is_deleted: 0,
        },
        data: {
          status: "2",
          comment: `回退到节点 ${targetNodeId}：${params.reason}`,
          completed_at: new Date(),
        },
      });

      // 8.2 新建回退任务（不改原记录，保证历史可追溯）
      const newTask = await tx.wf_task.create({
        data: {
          tenant_id: tenantId,
          instance_id: task.instance_id,
          node_id: targetNodeId,
          node_name: targetNode.name ?? targetNodeId,
          node_type: targetNode.type,
          assignee_id: previousTask.assignee_id,
          assignee_type: previousTask.assignee_type,
          candidate_ids: previousTask.candidate_ids as any,
          is_add_sign: 0,
          node_visit_count: (previousTask.node_visit_count ?? 1) + 1, // ⭐ +1
          rollback_from_task_id: task.task_id, // ⭐ 记录来源
          priority: previousTask.priority,
          due_at: null,
          status: "0",
          is_deleted: 0,
        },
      });

      // 8.3 更新实例的 active_nodes
      const currentActive = (instance.active_nodes as string[]) ?? [];
      const newActive = [
        ...new Set([
          ...currentActive.filter((n) => n !== task.node_id),
          targetNodeId,
        ]),
      ];
      await tx.wf_instance.update({
        where: { instance_id: task.instance_id },
        data: { active_nodes: newActive as any },
      });

      // 8.4 写日志
      await tx.wf_task_transfer_log.create({
        data: {
          tenant_id: tenantId,
          task_id: task.task_id,
          instance_id: task.instance_id,
          action_type: "rollback",
          from_user_id: task.assignee_id,
          to_user_id: previousTask.assignee_id,
          operator_id: operatorId,
          reason: params.reason,
          metadata: {
            fromNodeId: task.node_id,
            toNodeId: targetNodeId,
            newTaskId: newTask.task_id,
          } as any,
        },
      });

      // 8.5 写历史
      await tx.wf_history.create({
        data: {
          tenant_id: tenantId,
          instance_id: task.instance_id,
          node_id: task.node_id,
          node_name: task.node_name,
          node_type: task.node_type,
          event_type: "rollback",
          operator_id: operatorId,
          comment: `回退到节点 ${targetNode.name ?? targetNodeId}：${params.reason}`,
          variables: { toNodeId: targetNodeId } as any,
        },
      });
    });

    // 9. 通知原审批人
    if (previousTask.assignee_id) {
      void wfNotificationService
        .notify({
          tenantId,
          instanceId: task.instance_id,
          taskId: task.task_id,
          nodeId: targetNodeId,
          eventType: "assign",
          receiverIds: [previousTask.assignee_id],
          extra: { reason: `任务被回退：${params.reason}` },
        })
        .catch(() => undefined);
    }

    logger.info(
      {
        taskId: task.task_id,
        fromNode: task.node_id,
        toNode: targetNodeId,
        operatorId,
      },
      "[wf] rollback",
    );
  }

  /** 找上游节点（简单实现：取一条入边） */
  private findPreviousNode(
    currentNodeId: string,
    definition: any,
  ): string | null {
    const edges = definition?.edges ?? [];
    const incoming = edges.find(
      (e: any) => e.target === currentNodeId && !e.isDefault,
    );
    return incoming?.source ?? null;
  }
}

export const wfRollbackService = new WfRollbackService();
