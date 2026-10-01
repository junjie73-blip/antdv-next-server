import { prisma } from "@/config/database.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { NodeExecutor, type ExecutionContext } from "./node-executor.js";
import type { WfDefinitionJSON } from "../types.js";
import { wfNotificationService } from "./notification.service.js";

const MAX_TITLE_LENGTH = 256;
const MAX_COMMENT_LENGTH = 1000;

export interface StartParams {
  tenantId: string;
  defKey: string;
  businessKey?: string;
  title: string;
  variables: Record<string, any>;
  initiatorId: string;
  initiatorDeptId?: string | null;
}

export interface CompleteTaskParams {
  taskId: string;
  tenantId: string;
  userId: string;
  action: "approve" | "reject";
  comment?: string;
  formData?: Record<string, any>;
  variables?: Record<string, any>;
}

export class WorkflowEngine {
  /* ============================================================
   * 发起流程
   * ============================================================ */
  async start(params: StartParams) {
    this.validateStartParams(params);

    // 1. 查最新已发布版本
    const def = await prisma.wf_definition.findFirst({
      where: {
        tenant_id: params.tenantId,
        def_key: params.defKey,
        status: "1",
        is_deleted: 0,
      },
      orderBy: { version: "desc" },
    });

    if (!def) {
      throw new AppError(
        `流程定义 ${params.defKey} 不存在或未发布`,
        404001,
        404,
      );
    }

    const definition = def.definition as unknown as WfDefinitionJSON;
    if (!definition?.nodes?.length) {
      throw new AppError("流程定义无效", 400001, 400);
    }

    // 2. 变量校验
    this.validateVariables(definition, params.variables);

    // 3. 查发起人部门
    let initiatorDeptId = params.initiatorDeptId;
    if (initiatorDeptId === undefined) {
      const userDept = await prisma.sys_user_dept.findFirst({
        where: {
          user_id: params.initiatorId,
          tenant_id: params.tenantId,
          is_primary: 1,
        },
        select: { dept_id: true },
      });
      initiatorDeptId = userDept?.dept_id ?? null;
    }

    // 4. 事务：创建实例 + 执行节点
    const pendingNotifications: Array<{
      eventType: string;
      receiverIds: string[];
      taskId?: string;
      nodeId?: string;
    }> = [];

    const instance = await prisma.$transaction(async (tx) => {
      const inst = await tx.wf_instance.create({
        data: {
          tenant_id: params.tenantId,
          def_id: def.def_id,
          def_key: def.def_key,
          def_version: def.version,
          business_key: params.businessKey ?? null,
          title: params.title,
          initiator_id: params.initiatorId,
          initiator_dept_id: initiatorDeptId,
          variables: params.variables as any,
          status: "0",
          active_nodes: [],
        },
      });

      const startNode = definition.nodes.find((n) => n.type === "start");
      if (!startNode) throw new AppError("流程缺少 start 节点", 400001, 400);

      const ctx: ExecutionContext = {
        tenantId: params.tenantId,
        instanceId: inst.instance_id,
        initiatorId: params.initiatorId,
        initiatorDeptId,
        variables: params.variables,
        definition,
        onTaskCreated: (task, assignee) => {
          pendingNotifications.push({
            eventType: "assign",
            receiverIds: [assignee],
            taskId: task.task_id,
            nodeId: task.node_id,
          });
        },
      };

      await NodeExecutor.execute(startNode.id, ctx, tx);

      return inst;
    });

    // 5. 事务外发通知
    setImmediate(async () => {
      // 1. 通知发起人
      await wfNotificationService.notifyStart({
        tenantId: params.tenantId,
        instanceId: instance.instance_id,
        initiatorId: params.initiatorId,
      });
    });
    logger.info(
      {
        instanceId: instance.instance_id,
        defKey: params.defKey,
        initiatorId: params.initiatorId,
      },
      "[wf] 流程已发起",
    );

    return instance;
  }

  /* ============================================================
   * 完成任务
   * ============================================================ */
  async completeTask(params: CompleteTaskParams) {
    this.validateCompleteParams(params);

    const pendingNotifications: Array<{
      eventType: string;
      receiverIds: string[];
      taskId?: string;
      nodeId?: string;
    }> = [];

    const result = await prisma.$transaction(async (tx) => {
      // 1. 查任务
      const task = await tx.wf_task.findFirst({
        where: {
          task_id: params.taskId,
          tenant_id: params.tenantId,
          status: "0",
          is_deleted: 0,
        },
      });
      if (!task) throw new AppError("任务不存在或已处理", 404001, 404);

      // 2. 权限校验
      this.assertCanHandle(task, params.userId);

      // 3. 查实例
      const instance = await tx.wf_instance.findUnique({
        where: { instance_id: task.instance_id },
      });
      if (!instance) throw new AppError("流程实例不存在", 404001, 404);
      if (instance.status !== "0")
        throw new AppError("流程已结束", 400002, 400);

      // 4. 多签
      if (
        task.node_type === "countersignTask" ||
        task.node_type === "orSignTask"
      ) {
        return this.handleMultiSign(
          task,
          instance,
          params,
          tx,
          pendingNotifications,
        );
      }

      // 5. 单人任务
      await tx.wf_task.update({
        where: { task_id: task.task_id },
        data: {
          status: "1",
          action: params.action,
          comment: params.comment?.slice(0, MAX_COMMENT_LENGTH) ?? null,
          form_data: params.formData as any,
          completed_at: new Date(),
          duration_ms: Date.now() - task.created_at.getTime(),
        },
      });

      // 6. 合并变量
      const mergedVars = this.mergeVariables(instance.variables, params);
      await tx.wf_instance.update({
        where: { instance_id: task.instance_id },
        data: { variables: mergedVars as any },
      });

      if (params.variables && Object.keys(params.variables).length > 0) {
        await tx.wf_variable_log.createMany({
          data: Object.entries(params.variables).map(([key, value]) => ({
            tenant_id: params.tenantId,
            instance_id: task.instance_id,
            task_id: task.task_id,
            key,
            value: value as any,
            created_by: params.userId,
          })),
        });
      }

      // 7. 驳回 → 终止
      if (params.action === "reject") {
        await this.terminateInstance(
          task.instance_id,
          params.tenantId,
          params.userId,
          `驳回：${params.comment ?? "无"}`,
          tx,
        );
        await tx.wf_history.create({
          data: {
            tenant_id: params.tenantId,
            instance_id: task.instance_id,
            node_id: task.node_id,
            node_name: task.node_name,
            node_type: task.node_type,
            event_type: "reject",
            operator_id: params.userId,
            comment: params.comment,
          },
        });
        return {
          instanceId: task.instance_id,
          action: "reject",
          finished: true,
        };
      }

      // 8. 通过 → 流转
      await this.removeActiveNode(task.instance_id, task.node_id, tx);

      const def = await tx.wf_definition.findUnique({
        where: { def_id: instance.def_id },
      });
      if (!def) throw new AppError("流程定义不存在", 404001, 404);
      const definition = def.definition as unknown as WfDefinitionJSON;

      const ctx: ExecutionContext = {
        tenantId: params.tenantId,
        instanceId: task.instance_id,
        initiatorId: instance.initiator_id,
        initiatorDeptId: instance.initiator_dept_id,
        variables: mergedVars,
        definition,
        onTaskCreated: (t, assignee) => {
          pendingNotifications.push({
            eventType: "assign",
            receiverIds: [assignee],
            taskId: t.task_id,
            nodeId: t.node_id,
          });
        },
      };

      const nextIds = this.getNextNodeIds(task.node_id, definition);
      const readyNextIds = await this.filterParallelReadyNodes(
        nextIds,
        task.instance_id,
        definition,
        tx,
      );

      for (const nextId of readyNextIds) {
        await NodeExecutor.execute(nextId, ctx, tx);
      }

      return {
        instanceId: task.instance_id,
        action: "approve",
        finished: false,
      };
    });

    if (result.finished) {
      const instance = await prisma.wf_instance.findUnique({
        where: { instance_id: result.instanceId },
        select: { initiator_id: true },
      });
      if (instance) {
        setImmediate(() => {
          void wfNotificationService.notifyComplete({
            tenantId: params.tenantId,
            instanceId: result.instanceId,
            initiatorId: instance.initiator_id,
            result: result.action === "approve" ? "approved" : "rejected",
            comment: params.comment,
          });
        });
      }
    }

    logger.info(
      {
        taskId: params.taskId,
        instanceId: result.instanceId,
        action: params.action,
      },
      "[wf] 任务完成",
    );

    return result;
  }

  /* ============================================================
   * 多签完成
   * ============================================================ */
  private async handleMultiSign(
    task: any,
    instance: any,
    params: CompleteTaskParams,
    tx: any,
    pendingNotifications: any[],
  ) {
    const completedIds = (task.completed_ids as string[]) ?? [];
    if (completedIds.includes(params.userId)) {
      throw new AppError("您已签署过此任务", 400001, 400);
    }

    const candidates = (task.candidate_ids as string[]) ?? [];
    if (!candidates.includes(params.userId)) {
      throw new AppError("您不是候选人", 403001, 403);
    }

    const newCompleted = [...completedIds, params.userId];

    await tx.wf_task.update({
      where: { task_id: task.task_id },
      data: {
        completed_ids: newCompleted as any,
        form_data: params.formData as any,
      },
    });

    const decision = this.evaluateMultiSign(task, newCompleted, params.action);

    if (!decision.isComplete) {
      await tx.wf_history.create({
        data: {
          tenant_id: params.tenantId,
          instance_id: task.instance_id,
          node_id: task.node_id,
          node_name: task.node_name,
          node_type: task.node_type,
          event_type: "complete",
          operator_id: params.userId,
          comment: params.comment,
          variables: {
            completedCount: newCompleted.length,
            totalCount: candidates.length,
            pending: true,
          } as any,
        },
      });
      return {
        instanceId: task.instance_id,
        action: params.action,
        pending: true,
        finished: false,
      };
    }

    // 完成
    await tx.wf_task.update({
      where: { task_id: task.task_id },
      data: {
        status: "1",
        action: decision.isPassed ? "approve" : "reject",
        comment: params.comment ?? null,
        completed_at: new Date(),
        duration_ms: Date.now() - task.created_at.getTime(),
      },
    });

    if (!decision.isPassed) {
      await this.terminateInstance(
        task.instance_id,
        params.tenantId,
        params.userId,
        `${task.node_type === "countersignTask" ? "会签" : "或签"}驳回：${params.comment ?? "无"}`,
        tx,
      );
      return { instanceId: task.instance_id, action: "reject", finished: true };
    }

    await this.removeActiveNode(task.instance_id, task.node_id, tx);

    const def = await tx.wf_definition.findUnique({
      where: { def_id: instance.def_id },
    });
    const definition = def!.definition as unknown as WfDefinitionJSON;

    const mergedVars = this.mergeVariables(instance.variables, params);
    const ctx: ExecutionContext = {
      tenantId: params.tenantId,
      instanceId: task.instance_id,
      initiatorId: instance.initiator_id,
      initiatorDeptId: instance.initiator_dept_id,
      variables: mergedVars,
      definition,
      onTaskCreated: (t, assignee) => {
        pendingNotifications.push({
          eventType: "assign",
          receiverIds: [assignee],
          taskId: t.task_id,
          nodeId: t.node_id,
        });
      },
    };

    const nextIds = this.getNextNodeIds(task.node_id, definition);
    const readyNextIds = await this.filterParallelReadyNodes(
      nextIds,
      task.instance_id,
      definition,
      tx,
    );
    for (const nextId of readyNextIds) {
      await NodeExecutor.execute(nextId, ctx, tx);
    }

    return { instanceId: task.instance_id, action: "approve", finished: false };
  }

  /* ============================================================
   * 多签完成判断
   * ============================================================ */
  private evaluateMultiSign(
    task: any,
    completedIds: string[],
    currentAction: "approve" | "reject",
  ): { isComplete: boolean; isPassed: boolean } {
    const candidates = (task.candidate_ids as string[]) ?? [];
    const total = candidates.length;
    const passed = completedIds.length;

    if (currentAction === "reject") {
      return { isComplete: true, isPassed: false };
    }

    const signType = task.sign_type ?? "all";

    switch (signType) {
      case "any":
        return { isComplete: true, isPassed: true };
      case "all":
        return { isComplete: passed >= total, isPassed: passed >= total };
      case "sequential":
        return { isComplete: passed >= total, isPassed: passed >= total };
      default: {
        const strategy = task.sign_strategy as { percent?: number } | null;
        if (strategy?.percent) {
          const ratio = (passed / total) * 100;
          if (ratio >= strategy.percent) {
            return { isComplete: true, isPassed: true };
          }
        }
        return { isComplete: false, isPassed: false };
      }
    }
  }

  /* ============================================================
   * 终止
   * ============================================================ */
  async terminateInstance(
    instanceId: string,
    tenantId: string,
    operatorId: string,
    reason: string,
    tx: any,
  ): Promise<void> {
    const instance = await tx.wf_instance.findUnique({
      where: { instance_id: instanceId },
      select: { start_at: true },
    });

    const duration = instance?.start_at
      ? Date.now() - instance.start_at.getTime()
      : 0;

    await tx.wf_instance.update({
      where: { instance_id: instanceId },
      data: {
        status: "2",
        end_at: new Date(),
        duration_ms: duration,
        active_nodes: [],
      },
    });

    await tx.wf_task.updateMany({
      where: {
        instance_id: instanceId,
        tenant_id: tenantId,
        status: "0",
        is_deleted: 0,
      },
      data: {
        status: "2",
        comment: reason,
        completed_at: new Date(),
      },
    });

    await tx.wf_history.create({
      data: {
        tenant_id: tenantId,
        instance_id: instanceId,
        node_id: "terminate",
        node_name: "流程终止",
        node_type: "end",
        event_type: "terminate",
        operator_id: operatorId,
        comment: reason,
      },
    });

    logger.info({ instanceId, reason }, "[wf] 流程终止");
  }

  /* ============================================================
   * 挂起 / 恢复
   * ============================================================ */
  async suspendInstance(
    instanceId: string,
    tenantId: string,
    operatorId: string,
  ) {
    const instance = await prisma.wf_instance.findFirst({
      where: { instance_id: instanceId, tenant_id: tenantId, is_deleted: 0 },
    });
    if (!instance) throw new AppError("流程实例不存在", 404001, 404);
    if (instance.status !== "0")
      throw new AppError("只能挂起运行中的流程", 400001, 400);

    await prisma.wf_instance.update({
      where: { instance_id: instanceId },
      data: { status: "3" },
    });

    logger.info({ instanceId, operatorId }, "[wf] 流程已挂起");
  }

  async resumeInstance(
    instanceId: string,
    tenantId: string,
    operatorId: string,
  ) {
    const instance = await prisma.wf_instance.findFirst({
      where: { instance_id: instanceId, tenant_id: tenantId, is_deleted: 0 },
    });
    if (!instance) throw new AppError("流程实例不存在", 404001, 404);
    if (instance.status !== "3")
      throw new AppError("只能恢复挂起的流程", 400001, 400);

    await prisma.wf_instance.update({
      where: { instance_id: instanceId },
      data: { status: "0" },
    });

    logger.info({ instanceId, operatorId }, "[wf] 流程已恢复");
  }

  async terminate(
    instanceId: string,
    tenantId: string,
    operatorId: string,
    reason: string,
  ) {
    const instance = await prisma.wf_instance.findFirst({
      where: { instance_id: instanceId, tenant_id: tenantId, is_deleted: 0 },
    });
    if (!instance) throw new AppError("流程实例不存在", 404001, 404);
    if (instance.status !== "0" && instance.status !== "3") {
      throw new AppError("流程已结束", 400002, 400);
    }

    await prisma.$transaction(async (tx) => {
      await this.terminateInstance(
        instanceId,
        tenantId,
        operatorId,
        reason,
        tx,
      );
    });
  }

  /* ============================================================
   * 校验 / 工具
   * ============================================================ */
  private validateStartParams(params: StartParams): void {
    if (!params.defKey) throw new AppError("缺少流程标识", 400001, 400);
    if (!params.title) throw new AppError("缺少流程标题", 400001, 400);
    if (params.title.length > MAX_TITLE_LENGTH) {
      throw new AppError(
        `标题过长（最多 ${MAX_TITLE_LENGTH} 字符）`,
        400001,
        400,
      );
    }
  }

  private validateCompleteParams(params: CompleteTaskParams): void {
    if (!params.taskId) throw new AppError("缺少任务 ID", 400001, 400);
    if (!["approve", "reject"].includes(params.action)) {
      throw new AppError("无效的操作类型", 400001, 400);
    }
    if (params.comment && params.comment.length > MAX_COMMENT_LENGTH) {
      throw new AppError(
        `备注过长（最多 ${MAX_COMMENT_LENGTH} 字符）`,
        400001,
        400,
      );
    }
  }

  private validateVariables(
    definition: WfDefinitionJSON,
    variables: Record<string, any>,
  ): void {
    for (const v of definition.variables ?? []) {
      if (v.required && variables[v.name] === undefined) {
        throw new AppError(`缺少必填变量：${v.name}`, 400001, 400);
      }
    }
  }

  private mergeVariables(
    original: any,
    params: CompleteTaskParams,
  ): Record<string, any> {
    return {
      ...((original as Record<string, any>) ?? {}),
      ...(params.variables ?? {}),
      [`task_${params.taskId}_action`]: params.action,
      [`task_${params.taskId}_comment`]: params.comment,
      [`task_${params.taskId}_at`]: new Date().toISOString(),
    };
  }

  private assertCanHandle(task: any, userId: string): void {
    if (task.node_type === "userTask") {
      if (task.assignee_id && task.assignee_id !== userId) {
        const candidates = (task.candidate_ids as string[]) ?? [];
        if (!candidates.includes(userId)) {
          throw new AppError("无权处理此任务", 403001, 403);
        }
      }
      return;
    }

    if (
      task.node_type === "countersignTask" ||
      task.node_type === "orSignTask"
    ) {
      const candidates = (task.candidate_ids as string[]) ?? [];
      if (!candidates.includes(userId)) {
        throw new AppError("您不是此任务的候选人", 403001, 403);
      }
    }
  }

  private async removeActiveNode(
    instanceId: string,
    nodeId: string,
    tx: any,
  ): Promise<void> {
    const instance = await tx.wf_instance.findUnique({
      where: { instance_id: instanceId },
      select: { active_nodes: true },
    });
    const current = ((instance?.active_nodes as string[]) ?? []).filter(
      (id: string) => id !== nodeId,
    );
    await tx.wf_instance.update({
      where: { instance_id: instanceId },
      data: { active_nodes: current as any },
    });
  }

  private getNextNodeIds(
    nodeId: string,
    definition: WfDefinitionJSON,
  ): string[] {
    const edges = (definition.edges ?? []).filter((e) => e.source === nodeId);
    if (edges.length > 0) {
      return edges.filter((e) => !e.condition).map((e) => e.target);
    }
    return [];
  }

  private async filterParallelReadyNodes(
    nextIds: string[],
    instanceId: string,
    definition: WfDefinitionJSON,
    tx: any,
  ): Promise<string[]> {
    const ready: string[] = [];

    for (const nextId of nextIds) {
      const node = definition.nodes.find((n) => n.id === nextId);
      if (!node) continue;

      if (node.type !== "parallelGateway") {
        ready.push(nextId);
        continue;
      }

      const incomingEdges = (definition.edges ?? []).filter(
        (e) => e.target === nextId,
      );

      if (incomingEdges.length <= 1) {
        ready.push(nextId);
        continue;
      }

      const completedNodes = await tx.wf_history.findMany({
        where: {
          instance_id: instanceId,
          event_type: "complete",
          node_id: { in: incomingEdges.map((e) => e.source) },
        },
        select: { node_id: true },
      });

      const completedSet = new Set(completedNodes.map((h: any) => h.node_id));
      const allArrived = incomingEdges.every((e) => completedSet.has(e.source));

      if (allArrived) ready.push(nextId);
    }

    return ready;
  }
}

export const workflowEngine = new WorkflowEngine();
