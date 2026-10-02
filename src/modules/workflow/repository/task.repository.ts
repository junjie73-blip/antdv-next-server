import { prisma } from "@/config/database.js";
import { Prisma } from "@/generated/prisma/client.js";
import { BaseRepository } from "@/core/index.js";

export interface TaskListParams {
  tenantId?: string;
  userId?: string;
  keyword?: string;
  defKey?: string;
  priority?: number;
  pageNum?: number;
  pageSize?: number;
}

export class WfTaskRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.wf_task;
  protected readonly primaryKey = "task_id";
  protected readonly tenantField = "tenant_id";

  /* ============================================================
   * 详情
   * ============================================================ */
  async findById(taskId: string, tenantId: string) {
    return this.model.findFirst({
      where: { task_id: taskId, tenant_id: tenantId, is_deleted: 0 },
      include: { instance: true },
    });
  }

  async findByInstance(instanceId: string) {
    return this.model.findMany({
      where: { instance_id: instanceId, is_deleted: 0 },
      orderBy: { created_at: "asc" },
    });
  }

  /* ============================================================
   * 创建
   * ============================================================ */
  async create(data: Prisma.wf_taskUncheckedCreateInput) {
    return this.model.create({ data });
  }

  /* ============================================================
   * 更新
   * ============================================================ */
  async update(taskId: string, data: Prisma.wf_taskUncheckedUpdateInput) {
    return this.model.update({
      where: { task_id: taskId },
      data: { ...data, updated_at: new Date() },
    });
  }

  /* ============================================================
   * 批量取消
   * ============================================================ */
  async cancelByInstance(instanceId: string, tenantId: string, reason: string) {
    return this.model.updateMany({
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
  }

  /* ============================================================
   * 超时扫描
   * ============================================================ */
  async findTimeoutTasks(limit = 100) {
    return this.model.findMany({
      where: {
        status: "0",
        is_deleted: 0,
        due_at: { lte: new Date() },
      },
      take: limit,
    });
  }
  /** 查询任务的后加签子任务 */
  async findAddSignChildren(parentTaskId: string, tenantId: string) {
    return prisma.wf_task.findMany({
      where: {
        add_sign_parent_id: parentTaskId,
        tenant_id: tenantId,
        is_deleted: 0,
        status: "0", // 未完成
      },
      orderBy: { created_at: "asc" },
    });
  }
  async updateAssignee(
    taskId: string,
    tenantId: string,
    patch: {
      assigneeId: string;
      originalAssigneeId?: string | null;
      isAddSign?: number;
      addSignType?: "before" | "after" | null;
      addSignParentId?: string | null;
      transferredFromId?: string | null;
      transferredAt?: Date | null;
    },
  ) {
    const data: any = {
      assignee_id: patch.assigneeId,
      updated_at: new Date(),
    };
    if (patch.originalAssigneeId !== undefined) {
      data.original_assignee_id = patch.originalAssigneeId;
    }
    if (patch.isAddSign !== undefined) data.is_add_sign = patch.isAddSign;
    if (patch.addSignType !== undefined) data.add_sign_type = patch.addSignType;
    if (patch.addSignParentId !== undefined) {
      data.add_sign_parent_id = patch.addSignParentId;
    }
    if (patch.transferredFromId !== undefined) {
      data.transferred_from_id = patch.transferredFromId;
    }
    if (patch.transferredAt !== undefined)
      data.transferred_at = patch.transferredAt;

    await prisma.wf_task.updateMany({
      where: { task_id: taskId, tenant_id: tenantId, is_deleted: 0 },
      data,
    });
  }

  /** 创建加签子任务 */
  async createAddSignTask(data: {
    tenantId: string;
    instanceId: string;
    nodeId: string;
    nodeName: string;
    nodeType: string;
    assigneeId: string;
    assigneeType: string;
    addSignType: "before" | "after";
    addSignParentId: string;
    priority?: number;
    dueAt?: Date | null;
  }) {
    return prisma.wf_task.create({
      data: {
        tenant_id: data.tenantId,
        instance_id: data.instanceId,
        node_id: data.nodeId,
        node_name: data.nodeName,
        node_type: data.nodeType,
        assignee_id: data.assigneeId,
        assignee_type: data.assigneeType,
        is_add_sign: 1,
        add_sign_type: data.addSignType,
        add_sign_parent_id: data.addSignParentId,
        priority: data.priority ?? 0,
        due_at: data.dueAt ?? null,
        status: "0",
        is_deleted: 0,
      },
    });
  }

  /** 判断任务是否为活跃（未完成、未取消） */
  async isActive(taskId: string, tenantId: string): Promise<boolean> {
    const t = await prisma.wf_task.findFirst({
      where: { task_id: taskId, tenant_id: tenantId, is_deleted: 0 },
      select: { status: true },
    });
    return !!t && t.status === "0";
  }
}
