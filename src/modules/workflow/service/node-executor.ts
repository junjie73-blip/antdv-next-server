import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { ExpressionEvaluator } from "./expression-evaluator.js";
import { AssigneeResolver, type ResolveContext } from "./assignee-resolver.js";
import type { WfDefinitionJSON, WfNode, WfEdge } from "../types.js";

type TxClient = Parameters<
  Parameters<typeof import("@/config/database.js").prisma.$transaction>[0]
>[0];

export interface ExecutionContext extends ResolveContext {
  onCcCreated?: (payload: {
    nodeId: string;
    nodeName: string;
    receivers: string[];
    title: string;
    content: string;
    realtime: boolean;
    pushMessage: boolean;
  }) => void;
  definition: WfDefinitionJSON;
  defKey?: string;
  /** 任务创建回调（供事务后发通知） */
  onTaskCreated?: (task: any, assignee: string) => void;
}

export interface NodeExecuteResult {
  completedNodes: string[];
  pendingNodes: string[];
  finished: boolean;
}

export class NodeExecutor {
  /**
   * 执行节点入口
   */
  static async execute(
    nodeId: string,
    ctx: ExecutionContext,
    tx: TxClient,
  ): Promise<NodeExecuteResult> {
    const result: NodeExecuteResult = {
      completedNodes: [],
      pendingNodes: [],
      finished: false,
    };

    await this.executeRecursive(nodeId, ctx, tx, result);
    return result;
  }

  private static async executeRecursive(
    nodeId: string,
    ctx: ExecutionContext,
    tx: TxClient,
    result: NodeExecuteResult,
  ): Promise<void> {
    const node = ctx.definition.nodes.find((n) => n.id === nodeId);
    if (!node) throw new AppError(`节点 ${nodeId} 不存在`, 400001, 400);

    logger.debug(
      { instanceId: ctx.instanceId, nodeId, type: node.type },
      "[wf] 执行节点",
    );

    await this.recordHistory(ctx, node, "start", tx);

    switch (node.type) {
      case "start":
        await this.handleStart(node, ctx, tx, result);
        break;
      case "end":
        await this.handleEnd(node, ctx, tx, result);
        break;
      case "userTask":
        await this.handleUserTask(node, ctx, tx, result);
        break;
      case "countersignTask":
      case "orSignTask":
        await this.handleMultiSignTask(node, ctx, tx, result);
        break;
      case "exclusiveGateway":
        await this.handleExclusiveGateway(node, ctx, tx, result);
        break;
      case "parallelGateway":
        await this.handleParallelGateway(node, ctx, tx, result);
        break;
      case "inclusiveGateway":
        await this.handleInclusiveGateway(node, ctx, tx, result);
        break;
      case "serviceTask":
      case "scriptTask":
        await this.handleServiceTask(node, ctx, tx, result);
        break;
      case "ccTask":
        await this.handleCcTask(node, ctx, tx, result);
        break;
      default:
        throw new AppError(
          `不支持的节点类型：${(node as any).type}`,
          400001,
          400,
        );
    }
  }

  /* ============================================================
   * start
   * ============================================================ */
  private static async handleStart(
    node: WfNode,
    ctx: ExecutionContext,
    tx: TxClient,
    result: NodeExecuteResult,
  ): Promise<void> {
    result.completedNodes.push(node.id);
    await this.recordHistory(ctx, node, "complete", tx);

    for (const id of this.getNextNodeIds(node.id, ctx.definition)) {
      await this.executeRecursive(id, ctx, tx, result);
    }
  }

  /* ============================================================
   * end
   * ============================================================ */
  private static async handleEnd(
    node: WfNode,
    ctx: ExecutionContext,
    tx: TxClient,
    result: NodeExecuteResult,
  ): Promise<void> {
    const instance = await tx.wf_instance.findUnique({
      where: { instance_id: ctx.instanceId! },
      select: { start_at: true },
    });

    const duration = instance?.start_at
      ? Date.now() - instance.start_at.getTime()
      : 0;

    await tx.wf_instance.update({
      where: { instance_id: ctx.instanceId! },
      data: {
        status: "1",
        end_at: new Date(),
        duration_ms: duration,
        active_nodes: [],
      },
    });

    await this.recordHistory(ctx, node, "complete", tx);

    result.completedNodes.push(node.id);
    result.finished = true;

    logger.info({ instanceId: ctx.instanceId, duration }, "[wf] 流程完成");
  }

  /* ============================================================
   * userTask
   * ============================================================ */
  private static async handleUserTask(
    node: WfNode,
    ctx: ExecutionContext,
    tx: TxClient,
    result: NodeExecuteResult,
  ): Promise<void> {
    if (!node.assignee) {
      throw new AppError(
        `节点 ${node.name ?? node.id} 缺少审批人配置`,
        400001,
        400,
      );
    }

    const userIds = await AssigneeResolver.resolve(node.assignee, ctx);
    if (userIds.length === 0) {
      throw new AppError(
        `节点 ${node.name ?? node.id} 未找到有效审批人`,
        400001,
        400,
      );
    }

    const [primaryAssignee, ...candidates] = userIds;

    const task = await tx.wf_task.create({
      data: {
        tenant_id: ctx.tenantId,
        instance_id: ctx.instanceId!,
        node_id: node.id,
        node_name: node.name ?? node.id,
        node_type: "userTask",
        assignee_id: primaryAssignee,
        assignee_type: node.assignee.type,
        candidate_ids: candidates.length > 0 ? (candidates as any) : null,
        priority: node.priority ?? 0,
        due_at: this.calcDueAt(node),
      },
    });
    await tx.wf_task_transfer_log.updateMany({
      where: {
        instance_id: ctx.instanceId!,
        action_type: "delegate",
        task_id: ctx.instanceId!,
        created_at: { gte: new Date(Date.now() - 30_000) },
      },
      data: { task_id: task.task_id },
    });
    await this.addActiveNode(ctx.instanceId!, node.id, tx);
    await this.recordHistory(ctx, node, "assign", tx, {
      assigneeId: primaryAssignee,
      taskId: task.task_id,
    });

    result.pendingNodes.push(node.id);

    // 触发任务创建回调
    ctx.onTaskCreated?.(task, primaryAssignee);

    logger.info(
      {
        instanceId: ctx.instanceId,
        nodeId: node.id,
        taskId: task.task_id,
      },
      "[wf] userTask 已创建",
    );
  }

  /* ============================================================
   * 会签 / 或签
   * ============================================================ */
  private static async handleMultiSignTask(
    node: WfNode,
    ctx: ExecutionContext,
    tx: TxClient,
    result: NodeExecuteResult,
  ): Promise<void> {
    const cfg = node.countersign;
    if (!cfg) {
      throw new AppError(
        `节点 ${node.name ?? node.id} 缺少会签配置`,
        400001,
        400,
      );
    }

    const all: string[] = [];
    for (const a of cfg.assignees) {
      const ids = await AssigneeResolver.resolve(a, ctx);
      all.push(...ids);
    }
    const uniqueAssignees = [...new Set(all)];

    if (uniqueAssignees.length === 0) {
      throw new AppError(
        `节点 ${node.name ?? node.id} 未找到有效审批人`,
        400001,
        400,
      );
    }

    const isOrSign = node.type === "orSignTask";
    const signType = isOrSign ? "any" : (cfg.signType ?? "all");

    const task = await tx.wf_task.create({
      data: {
        tenant_id: ctx.tenantId,
        instance_id: ctx.instanceId!,
        node_id: node.id,
        node_name: node.name ?? node.id,
        node_type: isOrSign ? "orSignTask" : "countersignTask",
        assignee_id: null,
        assignee_type: "multi",
        candidate_ids: uniqueAssignees as any,
        sign_type: signType,
        sign_strategy: cfg.passPercent
          ? ({ percent: cfg.passPercent } as any)
          : null,
        completed_ids: [] as any,
        priority: node.priority ?? 0,
        due_at: this.calcDueAt(node),
      },
    });

    await this.addActiveNode(ctx.instanceId!, node.id, tx);
    await this.recordHistory(ctx, node, "assign", tx, {
      taskId: task.task_id,
      assignees: uniqueAssignees,
      signType,
    });

    result.pendingNodes.push(node.id);

    // 触发通知
    for (const assignee of uniqueAssignees) {
      ctx.onTaskCreated?.(task, assignee);
    }

    logger.info(
      {
        instanceId: ctx.instanceId,
        nodeId: node.id,
        taskId: task.task_id,
        count: uniqueAssignees.length,
      },
      "[wf] 多签任务已创建",
    );
  }

  /* ============================================================
   * 排他网关
   * ============================================================ */
  private static async handleExclusiveGateway(
    node: WfNode,
    ctx: ExecutionContext,
    tx: TxClient,
    result: NodeExecuteResult,
  ): Promise<void> {
    const edges = this.getOutgoingEdges(node.id, ctx.definition);
    if (edges.length === 0) {
      throw new AppError(
        `排他网关 ${node.name ?? node.id} 无出边`,
        400001,
        400,
      );
    }

    for (const edge of edges) {
      if (edge.isDefault) continue;
      if (!edge.condition) continue;

      let matched = false;
      try {
        matched = ExpressionEvaluator.evaluateBoolean(
          edge.condition,
          ctx.variables,
        );
      } catch (err: any) {
        logger.warn(
          { err: err.message, condition: edge.condition },
          "[wf] 网关条件求值失败",
        );
        continue;
      }

      if (matched) {
        await this.recordHistory(ctx, node, "complete", tx, {
          matchedCondition: edge.condition,
          next: edge.target,
        });
        result.completedNodes.push(node.id);
        await this.executeRecursive(edge.target, ctx, tx, result);
        return;
      }
    }

    const defaultEdge = edges.find((e) => e.isDefault);
    if (defaultEdge) {
      await this.recordHistory(ctx, node, "complete", tx, {
        matchedCondition: "default",
        next: defaultEdge.target,
      });
      result.completedNodes.push(node.id);
      await this.executeRecursive(defaultEdge.target, ctx, tx, result);
      return;
    }

    throw new AppError(
      `排他网关 ${node.name ?? node.id} 未匹配任何条件且无默认分支`,
      400001,
      400,
    );
  }

  /* ============================================================
   * 并行网关
   * ============================================================ */
  private static async handleParallelGateway(
    node: WfNode,
    ctx: ExecutionContext,
    tx: TxClient,
    result: NodeExecuteResult,
  ): Promise<void> {
    const outgoing = this.getOutgoingEdges(node.id, ctx.definition);

    if (outgoing.length === 0) {
      await this.recordHistory(ctx, node, "complete", tx, { converge: true });
      result.completedNodes.push(node.id);
      return;
    }

    await this.recordHistory(ctx, node, "complete", tx, {
      parallelBranches: outgoing.length,
    });
    result.completedNodes.push(node.id);

    for (const edge of outgoing) {
      await this.executeRecursive(edge.target, ctx, tx, result);
    }
  }

  /* ============================================================
   * 包容网关
   * ============================================================ */
  private static async handleInclusiveGateway(
    node: WfNode,
    ctx: ExecutionContext,
    tx: TxClient,
    result: NodeExecuteResult,
  ): Promise<void> {
    const outgoing = this.getOutgoingEdges(node.id, ctx.definition);
    const matched: WfEdge[] = [];

    for (const edge of outgoing) {
      if (edge.isDefault) continue;
      if (!edge.condition) {
        matched.push(edge);
        continue;
      }
      try {
        if (
          ExpressionEvaluator.evaluateBoolean(edge.condition, ctx.variables)
        ) {
          matched.push(edge);
        }
      } catch (err) {
        logger.warn({ err }, "[wf] 包容网关条件求值失败");
      }
    }

    if (matched.length === 0) {
      const def = outgoing.find((e) => e.isDefault);
      if (def) matched.push(def);
    }

    if (matched.length === 0) {
      throw new AppError(
        `包容网关 ${node.name ?? node.id} 无匹配分支`,
        400001,
        400,
      );
    }

    await this.recordHistory(ctx, node, "complete", tx, {
      matchedBranches: matched.length,
    });
    result.completedNodes.push(node.id);

    for (const edge of matched) {
      await this.executeRecursive(edge.target, ctx, tx, result);
    }
  }

  /* ============================================================
   * serviceTask / scriptTask
   * ============================================================ */
  private static async handleServiceTask(
    node: WfNode,
    ctx: ExecutionContext,
    tx: TxClient,
    result: NodeExecuteResult,
  ): Promise<void> {
    const config = node.serviceConfig ?? {};
    const action = config.action as string;

    try {
      switch (action) {
        case "log":
          logger.info(
            { instanceId: ctx.instanceId, nodeId: node.id, config },
            "[wf] serviceTask: log",
          );
          break;
        case "webhook":
          await this.invokeWebhook(config, ctx);
          break;
        case "notification":
          // 由上层通过 onTaskCreated 回调触发通知
          break;
        default:
          logger.warn({ action, nodeId: node.id }, "[wf] 未实现的 serviceTask");
      }

      await this.recordHistory(ctx, node, "complete", tx, { action });
      result.completedNodes.push(node.id);

      for (const id of this.getNextNodeIds(node.id, ctx.definition)) {
        await this.executeRecursive(id, ctx, tx, result);
      }
    } catch (err: any) {
      logger.error(
        { err, nodeId: node.id, action },
        "[wf] serviceTask 执行失败",
      );
      throw new AppError(
        `自动任务 ${node.name ?? node.id} 执行失败：${err.message}`,
        500001,
        500,
      );
    }
  }

  /* ============================================================
   * 工具方法
   * ============================================================ */
  private static getOutgoingEdges(
    nodeId: string,
    definition: WfDefinitionJSON,
  ): WfEdge[] {
    return (definition.edges ?? []).filter((e) => e.source === nodeId);
  }

  private static getNextNodeIds(
    nodeId: string,
    definition: WfDefinitionJSON,
  ): string[] {
    const edges = this.getOutgoingEdges(nodeId, definition);
    if (edges.length > 0) {
      return edges.filter((e) => !e.condition).map((e) => e.target);
    }
    return [];
  }

  private static calcDueAt(node: WfNode): Date | null {
    if (!node.timeout?.duration) return null;
    const match = /^(\d+)([smhd])$/.exec(node.timeout.duration);
    if (!match) return null;

    const [, value, unit] = match;
    const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
    if (!unitMs) return null;

    return new Date(Date.now() + Number(value) * unitMs);
  }

  private static async addActiveNode(
    instanceId: string,
    nodeId: string,
    tx: TxClient,
  ): Promise<void> {
    const instance = await tx.wf_instance.findUnique({
      where: { instance_id: instanceId },
      select: { active_nodes: true },
    });
    const current = (instance?.active_nodes as string[]) ?? [];
    if (!current.includes(nodeId)) {
      current.push(nodeId);
      await tx.wf_instance.update({
        where: { instance_id: instanceId },
        data: { active_nodes: current as any },
      });
    }
  }

  private static async recordHistory(
    ctx: ExecutionContext,
    node: WfNode,
    eventType: string,
    tx: TxClient,
    extra: Record<string, any> = {},
  ): Promise<void> {
    await tx.wf_history.create({
      data: {
        tenant_id: ctx.tenantId,
        instance_id: ctx.instanceId!,
        node_id: node.id,
        node_name: node.name ?? node.id,
        node_type: node.type,
        event_type: eventType,
        variables: extra as any,
      },
    });
  }

  private static async invokeWebhook(
    config: Record<string, any>,
    ctx: ExecutionContext,
  ): Promise<void> {
    const url = config.url;
    if (!url) throw new Error("Webhook URL 未配置");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instanceId: ctx.instanceId,
          initiatorId: ctx.initiatorId,
          variables: ctx.variables,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }
  private static async handleCcTask(
    node: WfNode,
    ctx: ExecutionContext,
    tx: TxClient,
    result: NodeExecuteResult,
  ): Promise<void> {
    if (!node.assignee) {
      throw new AppError(
        `抄送节点 ${node.name ?? node.id} 缺少抄送人配置`,
        400001,
        400,
      );
    }

    const receiverIds = await AssigneeResolver.resolve(node.assignee, ctx);
    if (receiverIds.length === 0) {
      logger.warn(
        { instanceId: ctx.instanceId, nodeId: node.id },
        "[wf] 抄送节点无有效接收人，跳过",
      );
      // 直接流转
      await this.recordHistory(ctx, node, "cc", tx, { skipped: true });
      result.completedNodes.push(node.id);
      for (const id of this.getNextNodeIds(node.id, ctx.definition)) {
        await this.executeRecursive(id, ctx, tx, result);
      }
      return;
    }

    // 批量插入抄送记录
    await tx.wf_cc_record.createMany({
      data: receiverIds.map((receiverId) => ({
        tenant_id: ctx.tenantId,
        instance_id: ctx.instanceId!,
        node_id: node.id,
        node_name: node.name ?? node.id,
        receiver_id: receiverId,
        title: ctx.variables["title"] ?? "",
        content: node.name ? `抄送：${node.name}` : "抄送通知",
        is_read: 0,
      })),
      skipDuplicates: true,
    });

    await this.recordHistory(ctx, node, "cc", tx, {
      receiverIds,
      count: receiverIds.length,
    });

    // ⭐ 抄送不阻塞流程，直接流转
    result.completedNodes.push(node.id);
    for (const id of this.getNextNodeIds(node.id, ctx.definition)) {
      await this.executeRecursive(id, ctx, tx, result);
    }

    // 事务外通知（通过 setImmediate 或由上层统一处理）
    for (const rid of receiverIds) {
      ctx.onTaskCreated?.(null as any, rid);
    }

    logger.info(
      {
        instanceId: ctx.instanceId,
        nodeId: node.id,
        receiverCount: receiverIds.length,
      },
      "[wf] cc task done",
    );
  }
  private static renderTemplate(
    template: string,
    ctx: ExecutionContext,
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      const value =
        ctx.variables?.[key] ??
        (key === "instanceId" ? ctx.instanceId : undefined) ??
        (key === "initiatorId" ? ctx.initiatorId : undefined);
      return value !== undefined && value !== null ? String(value) : "";
    });
  }
}
