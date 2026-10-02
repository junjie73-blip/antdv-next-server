import { prisma } from "@/config/database.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { WfTaskRepository } from "../repository/task.repository.js";
import { WfTaskTransferRepository } from "../repository/task-transfer.repository.js";
import { wfNotificationService } from "./notification.service.js";

export class WfTaskTransferService {
  private taskRepo = new WfTaskRepository();
  private logRepo = new WfTaskTransferRepository();

  /* ============================================================
   * 加签
   * ============================================================ */
  async addSign(
    taskId: string,
    tenantId: string,
    operatorId: string,
    params: {
      userIds: string[];
      signType: "before" | "after";
      comment?: string;
    },
  ): Promise<{ createdTasks: string[] }> {
    const task = await prisma.wf_task.findFirst({
      where: { task_id: taskId, tenant_id: tenantId, is_deleted: 0 },
    });
    if (!task) throw new AppError("任务不存在", 404001, 404);
    if (task.status !== "0")
      throw new AppError("任务已完成，无法加签", 400001, 400);

    // 权限校验
    const candidates = (task.candidate_ids as string[]) ?? [];
    if (task.assignee_id !== operatorId && !candidates.includes(operatorId)) {
      throw new AppError("您无权对此任务加签", 403001, 403);
    }

    // 校验被加签人
    const uniqueUsers = [...new Set(params.userIds)].filter(
      (uid) => uid !== task.assignee_id,
    );
    if (uniqueUsers.length === 0)
      throw new AppError("请选择有效的加签人", 400001, 400);

    const users = await prisma.sys_user.findMany({
      where: {
        user_id: { in: uniqueUsers },
        tenant_id: tenantId,
        is_deleted: 0,
        status: "1",
      },
    });
    if (users.length !== uniqueUsers.length)
      throw new AppError("存在无效的加签人", 400001, 400);

    const createdTasks: string[] = [];

    // ⭐ 加签链根 ID：如果当前 task 是加签子任务，继承根 ID
    const chainRootId = task.add_sign_chain_root_id ?? task.task_id;
    const currentLevel = task.node_visit_count ?? 1;

    await prisma.$transaction(async (tx) => {
      for (const user of users) {
        if (params.signType === "before") {
          // 前加签：把当前 task 的 assignee 改为新审批人，链根更新
          const originalAssignee = task.assignee_id;
          await tx.wf_task.update({
            where: { task_id: task.task_id },
            data: {
              original_assignee_id: originalAssignee,
              assignee_id: user.user_id,
              is_add_sign: 1,
              add_sign_type: "before",
              add_sign_chain_root_id: chainRootId, // ⭐
              updated_at: new Date(),
            },
          });
          createdTasks.push(task.task_id);
        } else {
          // 后加签：创建子任务
          const child = await tx.wf_task.create({
            data: {
              tenant_id: tenantId,
              instance_id: task.instance_id,
              node_id: task.node_id,
              node_name: task.node_name,
              node_type: task.node_type,
              assignee_id: user.user_id,
              assignee_type: "user",
              is_add_sign: 1,
              add_sign_type: "after",
              add_sign_parent_id: task.task_id,
              add_sign_chain_root_id: chainRootId, // ⭐
              node_visit_count: currentLevel + 1, // ⭐ 深度 +1
              priority: task.priority ?? 0,
              due_at: task.due_at,
              status: "0",
              is_deleted: 0,
            },
          });
          createdTasks.push(child.task_id);
        }

        await tx.wf_task_transfer_log.create({
          data: {
            tenant_id: tenantId,
            task_id: task.task_id,
            instance_id: task.instance_id,
            action_type:
              params.signType === "before"
                ? "add_sign_before"
                : "add_sign_after",
            from_user_id: task.assignee_id,
            to_user_id: user.user_id,
            operator_id: operatorId,
            reason: params.comment ?? null,
            metadata: { chainRootId, level: currentLevel + 1 } as any,
          },
        });
      }
    });

    // 通知
    for (const u of users) {
      void wfNotificationService
        .notify({
          tenantId,
          instanceId: task.instance_id,
          taskId: task.task_id,
          nodeId: task.node_id,
          eventType: "assign",
          receiverIds: [u.user_id],
        })
        .catch(() => undefined);
    }

    return { createdTasks };
  }

  /* ============================================================
   * 转办
   * ============================================================ */
  async transfer(
    taskId: string,
    tenantId: string,
    operatorId: string,
    params: { targetUserId: string; comment?: string },
  ): Promise<void> {
    // 1. 加载任务
    const task = await prisma.wf_task.findFirst({
      where: { task_id: taskId, tenant_id: tenantId, is_deleted: 0 },
    });
    if (!task) throw new AppError("任务不存在", 404001, 404);
    if (task.status !== "0") {
      throw new AppError("任务已完成，无法转办", 400001, 400);
    }

    // 2. 权限：只有当前 assignee 能转办
    if (task.assignee_id !== operatorId) {
      // 允许 candidate 转办
      const candidates = (task.candidate_ids as string[]) ?? [];
      if (!candidates.includes(operatorId)) {
        throw new AppError("您无权转办此任务", 403001, 403);
      }
    }

    // 3. 目标用户校验
    if (params.targetUserId === task.assignee_id) {
      throw new AppError("不能转办给当前审批人", 400001, 400);
    }
    const target = await prisma.sys_user.findFirst({
      where: {
        user_id: params.targetUserId,
        tenant_id: tenantId,
        is_deleted: 0,
        status: "1",
      },
      select: { user_id: true, username: true, real_name: true },
    });
    if (!target) throw new AppError("目标用户不存在或已禁用", 404001, 404);

    // 4. 更新 + 日志（事务）
    await prisma.$transaction(async (tx) => {
      await tx.wf_task.update({
        where: { task_id: task.task_id },
        data: {
          assignee_id: params.targetUserId,
          transferred_from_id: task.assignee_id,
          transferred_at: new Date(),
          // 保留原 candidate_ids，避免丢失
          updated_at: new Date(),
        },
      });
      await tx.wf_task_transfer_log.create({
        data: {
          tenant_id: tenantId,
          task_id: task.task_id,
          instance_id: task.instance_id,
          action_type: "transfer",
          from_user_id: task.assignee_id,
          to_user_id: params.targetUserId,
          operator_id: operatorId,
          reason: params.comment ?? null,
        },
      });
      await tx.wf_history.create({
        data: {
          tenant_id: tenantId,
          instance_id: task.instance_id,
          node_id: task.node_id,
          node_name: task.node_name,
          node_type: task.node_type,
          event_type: "transfer",
          operator_id: operatorId,
          comment: params.comment ?? null,
        },
      });
    });

    // 5. 通知
    void wfNotificationService
      .notify({
        tenantId,
        instanceId: task.instance_id,
        taskId: task.task_id,
        nodeId: task.node_id,
        eventType: "assign",
        receiverIds: [params.targetUserId],
        extra: { reason: "任务转办" },
      })
      .catch((err) => logger.warn({ err }, "[transfer] notify failed"));

    logger.info(
      { taskId, from: task.assignee_id, to: params.targetUserId, operatorId },
      "[wf] transfer",
    );
  }

  /* ============================================================
   * 查询加签/转办历史
   * ============================================================ */
  async history(taskId: string, tenantId: string) {
    return this.logRepo.findByTask(taskId, tenantId);
  }
  async batchTransfer(
    tenantId: string,
    operatorId: string,
    params: {
      sourceUserId: string;
      targetUserId: string;
      /** 限定实例，不传=全部 */
      instanceIds?: string[];
      /** 限定节点 */
      nodeIds?: string[];
      comment?: string;
    },
  ): Promise<{ transferred: number; skipped: number }> {
    // 1. 校验目标用户
    const target = await prisma.sys_user.findFirst({
      where: {
        user_id: params.targetUserId,
        tenant_id: tenantId,
        is_deleted: 0,
        status: "1",
      },
    });
    if (!target) throw new AppError("目标用户不存在或已禁用", 404001, 404);

    if (params.sourceUserId === params.targetUserId) {
      throw new AppError("源用户和目标用户不能相同", 400001, 400);
    }

    // 2. 查源用户的所有活跃任务
    const where: any = {
      tenant_id: tenantId,
      assignee_id: params.sourceUserId,
      status: "0",
      is_deleted: 0,
    };
    if (params.instanceIds?.length)
      where.instance_id = { in: params.instanceIds };
    if (params.nodeIds?.length) where.node_id = { in: params.nodeIds };

    const tasks = await prisma.wf_task.findMany({
      where,
      select: {
        task_id: true,
        instance_id: true,
        node_id: true,
        assignee_id: true,
      },
    });

    if (tasks.length === 0) {
      return { transferred: 0, skipped: 0 };
    }

    const now = new Date();
    let transferred = 0;

    // 3. 事务批量更新（分批 100 条避免 SQL 过大）
    const BATCH = 100;
    for (let i = 0; i < tasks.length; i += BATCH) {
      const chunk = tasks.slice(i, i + BATCH);
      await prisma.$transaction(async (tx) => {
        await tx.wf_task.updateMany({
          where: { task_id: { in: chunk.map((t) => t.task_id) } },
          data: {
            assignee_id: params.targetUserId,
            transferred_from_id: params.sourceUserId,
            transferred_at: now,
            updated_at: now,
          },
        });

        await tx.wf_task_transfer_log.createMany({
          data: chunk.map((t) => ({
            tenant_id: tenantId,
            task_id: t.task_id,
            instance_id: t.instance_id,
            action_type: "transfer",
            from_user_id: params.sourceUserId,
            to_user_id: params.targetUserId,
            operator_id: operatorId,
            reason: params.comment ?? "批量转办",
            metadata: { batch: true } as any,
          })),
        });
      });
      transferred += chunk.length;
    }

    // 4. 通知目标用户（一次性批量通知）
    const instanceIds = [...new Set(tasks.map((t) => t.instance_id))];
    for (const instanceId of instanceIds) {
      void wfNotificationService
        .notify({
          tenantId,
          instanceId,
          eventType: "assign",
          receiverIds: [params.targetUserId],
          extra: { reason: `批量转办（来自用户 ${params.sourceUserId}）` },
        })
        .catch(() => undefined);
    }

    logger.info(
      {
        tenantId,
        operatorId,
        sourceUserId: params.sourceUserId,
        targetUserId: params.targetUserId,
        transferred: tasks.length,
      },
      "[wf] batch transfer",
    );

    return { transferred, skipped: 0 };
  }
}
