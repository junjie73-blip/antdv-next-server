import { prisma } from "@/config/database.js";
import { Prisma } from "@/generated/prisma/client.js";
import { BaseRepository } from "@/core/index.js";

export interface InstanceListParams {
  tenantId?: string;
  initiatorId?: string;
  defKey?: string;
  status?: string;
  keyword?: string;
  startTime?: Date;
  endTime?: Date;
  pageNum?: number;
  pageSize?: number;
}

export class WfInstanceRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.wf_instance;
  protected readonly primaryKey = "instance_id";
  protected readonly tenantField = "tenant_id";

  /* ============================================================
   * 详情
   * ============================================================ */
  async findById(instanceId: string, tenantId: string) {
    return this.model.findFirst({
      where: { instance_id: instanceId, tenant_id: tenantId, is_deleted: 0 },
    });
  }

  /* ============================================================
   * 创建
   * ============================================================ */
  async create(data: Prisma.wf_instanceUncheckedCreateInput) {
    return this.model.create({ data });
  }

  /* ============================================================
   * 更新
   * ============================================================ */
  async update(
    instanceId: string,
    data: Prisma.wf_instanceUncheckedUpdateInput,
  ) {
    return this.model.update({
      where: { instance_id: instanceId },
      data: { ...data, updated_at: new Date() },
    });
  }

  /* ============================================================
   * 活跃节点管理（JSON 数组）
   * ============================================================ */
  async addActiveNode(instanceId: string, nodeId: string): Promise<void> {
    const instance = await prisma.wf_instance.findUnique({
      where: { instance_id: instanceId },
      select: { active_nodes: true },
    });
    const current = (instance?.active_nodes as string[]) ?? [];
    if (!current.includes(nodeId)) {
      current.push(nodeId);
      await prisma.wf_instance.update({
        where: { instance_id: instanceId },
        data: { active_nodes: current as any },
      });
    }
  }

  async removeActiveNode(instanceId: string, nodeId: string): Promise<void> {
    const instance = await prisma.wf_instance.findUnique({
      where: { instance_id: instanceId },
      select: { active_nodes: true },
    });
    const current = ((instance?.active_nodes as string[]) ?? []).filter(
      (id) => id !== nodeId,
    );
    await prisma.wf_instance.update({
      where: { instance_id: instanceId },
      data: { active_nodes: current as any },
    });
  }

  /* ============================================================
   * 历史
   * ============================================================ */
  async findHistory(instanceId: string) {
    return prisma.wf_history.findMany({
      where: { instance_id: instanceId },
      orderBy: { created_at: "asc" },
    });
  }
}
