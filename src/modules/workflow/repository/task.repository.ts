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
   * 我的待办
   * ============================================================ */
  async findTodoPage(params: TaskListParams) {
    const { tenantId, userId, keyword, defKey, priority, pageNum, pageSize } =
      params;

    const where: Prisma.wf_taskWhereInput = {
      tenant_id: tenantId,
      status: "0",
      is_deleted: 0,
      OR: [
        { assignee_id: userId },
        { candidate_ids: { array_contains: userId } },
      ],
    };

    if (priority !== undefined) where.priority = priority;

    if (keyword || defKey) {
      where.instance = {
        ...(keyword ? { title: { contains: keyword } } : {}),
        ...(defKey ? { def_key: defKey } : {}),
      };
    }

    const [list, total] = await Promise.all([
      this.model.findMany({
        where,
        include: {
          instance: {
            select: {
              instance_id: true,
              title: true,
              def_key: true,
              business_key: true,
              initiator_id: true,
              start_at: true,
            },
          },
        },
        orderBy: [{ priority: "desc" }, { created_at: "desc" }],
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      this.model.count({ where }),
    ]);

    return {
      list,
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /* ============================================================
   * 我的已办
   * ============================================================ */
  async findDonePage(params: TaskListParams) {
    const { tenantId, userId, keyword, pageNum, pageSize } = params;

    const where: Prisma.wf_taskWhereInput = {
      tenant_id: tenantId,
      status: "1",
      is_deleted: 0,
      OR: [
        { assignee_id: userId },
        { completed_ids: { array_contains: userId } },
      ],
    };

    if (keyword) {
      where.instance = { title: { contains: keyword } };
    }

    const [list, total] = await Promise.all([
      this.model.findMany({
        where,
        include: {
          instance: {
            select: {
              instance_id: true,
              title: true,
              def_key: true,
              business_key: true,
            },
          },
        },
        orderBy: { completed_at: "desc" },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      this.model.count({ where }),
    ]);

    return { list, total };
  }

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
}
