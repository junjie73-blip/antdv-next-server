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
   * 列表
   * ============================================================ */
  async findPage(params: InstanceListParams) {
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

    const where: Prisma.wf_instanceWhereInput = {
      tenant_id: tenantId,
      is_deleted: 0,
    };
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
      this.model.findMany({
        where,
        orderBy: { start_at: "desc" },
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
