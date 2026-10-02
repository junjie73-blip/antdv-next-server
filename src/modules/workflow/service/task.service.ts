import { prisma } from "@/config/database.js";
import { AppError } from "@/core/errors.js";
import { workflowEngine } from "./engine.js";
import type { WfCompleteTaskDTO } from "../schema.js";
import { WfTaskTransferService } from "./task-transfer.service.js";

export class WfTaskService {
  private transferService = new WfTaskTransferService();
  /**
   * 我的待办
   */
  async todo(params: {
    tenantId: string;
    userId: string;
    keyword?: string;
    defKey?: string;
    priority?: number;
    pageNum: number;
    pageSize: number;
  }) {
    const { tenantId, userId, keyword, defKey, priority, pageNum, pageSize } =
      params;

    const where: any = {
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
      prisma.wf_task.findMany({
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
      prisma.wf_task.count({ where }),
    ]);

    return { list, total };
  }

  /**
   * 我的已办
   */
  async done(params: {
    tenantId: string;
    userId: string;
    keyword?: string;
    pageNum: number;
    pageSize: number;
  }) {
    const { tenantId, userId, keyword, pageNum, pageSize } = params;

    const where: any = {
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
      prisma.wf_task.findMany({
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
      prisma.wf_task.count({ where }),
    ]);

    return { list, total };
  }

  async detail(taskId: string, tenantId: string) {
    const task = await prisma.wf_task.findFirst({
      where: { task_id: taskId, tenant_id: tenantId, is_deleted: 0 },
      include: { instance: true },
    });
    if (!task) throw new AppError("任务不存在", 404001, 404);
    return task;
  }

  /**
   * 完成任务
   */
  async complete(
    taskId: string,
    tenantId: string,
    userId: string,
    dto: WfCompleteTaskDTO,
  ) {
    return workflowEngine.completeTask({
      taskId,
      tenantId,
      userId,
      action: dto.action,
      comment: dto.comment,
      formData: dto.formData,
      variables: dto.variables,
    });
  }

  /**
   * 批量完成
   */
  async batchComplete(
    taskIds: string[],
    tenantId: string,
    userId: string,
    dto: Pick<WfCompleteTaskDTO, "action" | "comment">,
  ) {
    if (taskIds.length === 0) return { success: 0, failed: 0, errors: [] };
    if (taskIds.length > 50) {
      throw new AppError("单次最多批量处理 50 个任务", 400001, 400);
    }

    let success = 0;
    let failed = 0;
    const errors: Array<{ taskId: string; error: string }> = [];

    for (const taskId of taskIds) {
      try {
        await this.complete(taskId, tenantId, userId, dto as WfCompleteTaskDTO);
        success++;
      } catch (err: any) {
        failed++;
        errors.push({ taskId, error: err.message });
      }
    }

    return { success, failed, errors };
  }
  /** 加签 */
  async addSign(
    taskId: string,
    tenantId: string,
    operatorId: string,
    dto: { userIds: string[]; signType: "before" | "after"; comment?: string },
  ) {
    return this.transferService.addSign(taskId, tenantId, operatorId, dto);
  }

  /** 转办 */
  async transfer(
    taskId: string,
    tenantId: string,
    operatorId: string,
    dto: { targetUserId: string; comment?: string },
  ) {
    return this.transferService.transfer(taskId, tenantId, operatorId, dto);
  }

  /** 加签/转办历史 */
  async transferHistory(taskId: string, tenantId: string) {
    return this.transferService.history(taskId, tenantId);
  }
}
