import { prisma } from "@/config/database.js";
import type { WfTaskTransferLogEntity } from "../types.js";

export class WfTaskTransferRepository {
  /* ============================================================
   * 写日志
   * ============================================================ */
  async log(data: {
    tenantId: string;
    taskId: string;
    instanceId: string;
    actionType: "transfer" | "add_sign_before" | "add_sign_after" | "escalate";
    fromUserId?: string | null;
    toUserId?: string | null;
    operatorId: string;
    reason?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    await prisma.wf_task_transfer_log.create({
      data: {
        tenant_id: data.tenantId,
        task_id: data.taskId,
        instance_id: data.instanceId,
        action_type: data.actionType,
        from_user_id: data.fromUserId ?? null,
        to_user_id: data.toUserId ?? null,
        operator_id: data.operatorId,
        reason: data.reason ?? null,
        metadata: (data.metadata ?? null) as any,
      },
    });
  }

  /* ============================================================
   * 按 task 查询
   * ============================================================ */
  async findByTask(
    taskId: string,
    tenantId: string,
  ): Promise<WfTaskTransferLogEntity[]> {
    return prisma.wf_task_transfer_log.findMany({
      where: { task_id: taskId, tenant_id: tenantId },
      orderBy: { created_at: "asc" },
    }) as Promise<WfTaskTransferLogEntity[]>;
  }

  /* ============================================================
   * 按 instance 查询
   * ============================================================ */
  async findByInstance(
    instanceId: string,
    tenantId: string,
  ): Promise<WfTaskTransferLogEntity[]> {
    return prisma.wf_task_transfer_log.findMany({
      where: { instance_id: instanceId, tenant_id: tenantId },
      orderBy: { created_at: "asc" },
    }) as Promise<WfTaskTransferLogEntity[]>;
  }
}
