import { prisma } from "@/config/database.js";
import { AppError } from "@/core/errors.js";
import { workflowEngine } from "./engine.js";

export class WfInstanceService {
  async list(params: {
    tenantId: string;
    initiatorId?: string;
    defKey?: string;
    status?: string;
    keyword?: string;
    startTime?: Date;
    endTime?: Date;
    pageNum: number;
    pageSize: number;
  }) {
    const {
      tenantId,
      initiatorId,
      defKey,
      status,
      keyword,
      startTime,
      endTime,
      pageNum,
      pageSize,
    } = params;

    const where: any = { tenant_id: tenantId, is_deleted: 0 };
    if (initiatorId) where.initiator_id = initiatorId;
    if (defKey) where.def_key = defKey;
    if (status) where.status = status;
    if (keyword) where.title = { contains: keyword };
    if (startTime || endTime) {
      where.start_at = {};
      if (startTime) where.start_at.gte = startTime;
      if (endTime) where.start_at.lte = endTime;
    }

    const [list, total] = await Promise.all([
      prisma.wf_instance.findMany({
        where,
        orderBy: { start_at: "desc" },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        select: {
          instance_id: true,
          def_key: true,
          title: true,
          business_key: true,
          initiator_id: true,
          status: true,
          start_at: true,
          end_at: true,
          duration_ms: true,
          active_nodes: true,
        },
      }),
      prisma.wf_instance.count({ where }),
    ]);

    return { list, total };
  }

  async detail(instanceId: string, tenantId: string) {
    const instance = await prisma.wf_instance.findFirst({
      where: { instance_id: instanceId, tenant_id: tenantId, is_deleted: 0 },
    });
    if (!instance) throw new AppError("流程实例不存在", 404001, 404);

    const [tasks, history, definition, initiator] = await Promise.all([
      prisma.wf_task.findMany({
        where: { instance_id: instanceId, is_deleted: 0 },
        orderBy: { created_at: "asc" },
      }),
      prisma.wf_history.findMany({
        where: { instance_id: instanceId },
        orderBy: { created_at: "asc" },
      }),
      prisma.wf_definition.findUnique({ where: { def_id: instance.def_id } }),
      prisma.sys_user.findUnique({
        where: { user_id: instance.initiator_id },
        select: { real_name: true, username: true },
      }),
    ]);

    return {
      ...instance,
      initiator_name: initiator?.real_name ?? initiator?.username,
      tasks,
      history,
      definition: definition?.definition,
      definition_xml: definition?.definition_xml,
    };
  }

  async history(instanceId: string, tenantId: string) {
    const instance = await prisma.wf_instance.findFirst({
      where: { instance_id: instanceId, tenant_id: tenantId, is_deleted: 0 },
      select: { instance_id: true },
    });
    if (!instance) throw new AppError("流程实例不存在", 404001, 404);

    return prisma.wf_history.findMany({
      where: { instance_id: instanceId },
      orderBy: { created_at: "asc" },
    });
  }

  async suspend(instanceId: string, tenantId: string, userId: string) {
    await workflowEngine.suspendInstance(instanceId, tenantId, userId);
  }

  async resume(instanceId: string, tenantId: string, userId: string) {
    await workflowEngine.resumeInstance(instanceId, tenantId, userId);
  }

  async terminate(
    instanceId: string,
    tenantId: string,
    userId: string,
    reason: string,
  ) {
    if (!reason || reason.length > 500) {
      throw new AppError("终止原因必填且不超过 500 字", 400001, 400);
    }
    await workflowEngine.terminate(instanceId, tenantId, userId, reason);
  }

  /**
   * 流程图（带节点状态）
   */
  async diagram(instanceId: string, tenantId: string) {
    const instance = await prisma.wf_instance.findFirst({
      where: { instance_id: instanceId, tenant_id: tenantId, is_deleted: 0 },
    });
    if (!instance) throw new AppError("流程实例不存在", 404001, 404);

    const def = await prisma.wf_definition.findUnique({
      where: { def_id: instance.def_id },
    });
    if (!def) throw new AppError("流程定义不存在", 404001, 404);

    const history = await prisma.wf_history.findMany({
      where: { instance_id: instanceId },
      orderBy: { created_at: "asc" },
    });

    const definition = def.definition as any;
    const activeNodes = (instance.active_nodes as string[]) ?? [];

    const nodeStatus: Record<string, string> = {};
    const completedSet = new Set(
      history.filter((h) => h.event_type === "complete").map((h) => h.node_id),
    );
    const rejectSet = new Set(
      history.filter((h) => h.event_type === "reject").map((h) => h.node_id),
    );

    for (const node of definition.nodes ?? []) {
      if (rejectSet.has(node.id)) nodeStatus[node.id] = "rejected";
      else if (activeNodes.includes(node.id)) nodeStatus[node.id] = "active";
      else if (completedSet.has(node.id)) nodeStatus[node.id] = "completed";
      else nodeStatus[node.id] = "pending";
    }

    return {
      instanceId,
      status: instance.status,
      definition,
      definitionXml: def.definition_xml,
      nodeStatus,
      activeNodes,
    };
  }
}
