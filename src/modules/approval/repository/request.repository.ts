import { Prisma } from "@/generated/prisma/client.js";
import { NodeStatus } from "../types.js";
import { AppError, BaseRepository } from "@/core/index.js";
import { prisma } from "@/config/index.js";
import type { ApprovalFlowQueryDTO } from "../schema.js";

type TxClient = Omit<
  Prisma.TransactionClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;
export interface CreateRequestInput {
  tenant_id: string;
  title: string;
  content: string | null;
  form_data: Prisma.InputJsonValue;
  applicant_id: string;
  current_dept_id: string;
  status: string;
  is_deleted: number;
  created_by: string;
  updated_by: string;
}

export interface CreateNodeInput {
  tenant_id: string;
  dept_id: string;
  status: NodeStatus;
  is_deleted: number;
  created_by: string;
  updated_by: string;
}
export interface ApprovalLogInput {
  tenant_id: string;
  request_id: string;
  operator_id: string;
  operator_name: string;
  action: string;
  from_status?: string | null;
  to_status?: string | null;
  remark?: string | null;
  reason_type?: string | null;
  metadata?: Prisma.InputJsonValue | null;
}
export class ApprovalRequestRepository extends BaseRepository<
  any,
  any,
  any,
  any
> {
  protected readonly model = prisma.sys_approval_request;
  protected readonly primaryKey = "request_id";
  protected readonly tenantField = "tenant_id";
  /** 列表：手动查 nodes，不用 include */
  async findFlowPage(dto: ApprovalFlowQueryDTO, tenantId: string) {
    const where: Prisma.sys_approval_requestWhereInput = {
      tenant_id: tenantId,
      is_deleted: 0,
    };
    if (dto.title) where.title = { contains: dto.title };
    if (dto.status) where.status = dto.status;

    const finalWhere = this.mergeDataScope(where);

    const [list, total] = await Promise.all([
      this.model.findMany({
        where: finalWhere,
        orderBy: { created_at: "desc" },
        skip: (dto.page - 1) * dto.pageSize,
        take: dto.pageSize,
      }),
      this.model.count({ where: finalWhere }),
    ]);

    const requestIds = list.map((r: any) => r.request_id);
    const nodeMap = await this.loadNodesByRequestIds(requestIds, tenantId);

    const enriched = list.map((r: any) => ({
      ...r,
      nodes: nodeMap.get(r.request_id) ?? [],
    }));

    return { list: enriched, total };
  }

  /** 详情：手动查 nodes */
  async findFlowDetail(requestId: string, tenantId: string) {
    const request = await this.model.findFirst({
      where: { request_id: requestId, tenant_id: tenantId, is_deleted: 0 },
    });
    if (!request) return null;

    const nodeMap = await this.loadNodesByRequestIds([requestId], tenantId);
    return { ...request, nodes: nodeMap.get(requestId) ?? [] };
  }

  /** 关键：直接查 sys_approval_node 表 */
  private async loadNodesByRequestIds(requestIds: string[], tenantId: string) {
    const map = new Map<string, any[]>();
    if (requestIds.length === 0) return map;

    const allNodes = await prisma.sys_approval_node.findMany({
      where: {
        request_id: { in: requestIds },
        tenant_id: tenantId,
        is_deleted: 0,
      },
      orderBy: { sequence: "asc" },
    });

    for (const n of allNodes) {
      const arr = map.get(n.request_id) ?? [];
      arr.push(n);
      map.set(n.request_id, arr);
    }
    return map;
  }

  /** 部门链：不要 reverse */
  async getDeptHierarchy(deptId: string, tenantId: string) {
    const depts: {
      dept_id: string;
      parent_id: string | null;
      dept_name: string;
    }[] = [];
    let currentId: string | null = deptId;
    let depth = 0;
    while (currentId && depth < 20) {
      const dept = await prisma.sys_dept.findFirst({
        where: { dept_id: currentId, tenant_id: tenantId, is_deleted: 0 },
        select: { dept_id: true, parent_id: true, dept_name: true },
      });
      if (!dept) break;
      depts.push(dept);
      currentId = dept.parent_id;
      depth++;
    }
    return depts;
  }

  async createRequestWithNodes(
    requestData: CreateRequestInput,
    nodesData: CreateNodeInput[],
  ) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.sys_approval_request.create({
        data: requestData,
      });

      const nodes: Prisma.sys_approval_nodeCreateManyInput[] = nodesData.map(
        (node, index) => ({
          tenant_id: node.tenant_id,
          request_id: request.request_id,
          dept_id: node.dept_id,
          status: node.status,
          sequence: index + 1,
          is_current: index === 0 ? 1 : 0,
          is_deleted: node.is_deleted,
          created_by: node.created_by,
          updated_by: node.updated_by,
        }),
      );

      await tx.sys_approval_node.createMany({
        data: nodes,
        skipDuplicates: true,
      });
      return request;
    });
  }

  async findPendingTasks(tenantId: string, deptIds: string[]) {
    return prisma.sys_approval_node.findMany({
      where: {
        tenant_id: tenantId,
        dept_id: { in: deptIds },
        status: NodeStatus.PENDING,
        is_current: 1,
        is_deleted: 0,
      },
      orderBy: { created_at: "desc" },
    });
  }

  async findDeptNames(
    deptIds: string[],
    tenantId: string,
  ): Promise<Map<string, string>> {
    if (deptIds.length === 0) return new Map();
    const rows = await prisma.sys_dept.findMany({
      where: { dept_id: { in: deptIds }, tenant_id: tenantId, is_deleted: 0 },
      select: { dept_id: true, dept_name: true },
    });
    return new Map(rows.map((r) => [r.dept_id, r.dept_name]));
  }

  async findUserNames(
    userIds: string[],
    tenantId: string,
  ): Promise<Map<string, string>> {
    if (userIds.length === 0) return new Map();
    const rows = await prisma.sys_user.findMany({
      where: { user_id: { in: userIds }, tenant_id: tenantId, is_deleted: 0 },
      select: { user_id: true, username: true, real_name: true },
    });
    return new Map(rows.map((r) => [r.user_id, r.real_name ?? r.username]));
  }
  /**
   * 判断用户是否是其所在部门的负责人
   * 依据：sys_dept.leader 字段（存 username 或 real_name）
   */
  async isUserLeaderOfDept(
    userId: string,
    deptId: string,
    tenantId: string,
    tx?: TxClient,
  ): Promise<boolean> {
    const client = tx ?? prisma;

    const [user, dept] = await Promise.all([
      client.sys_user.findFirst({
        where: { user_id: userId, tenant_id: tenantId, is_deleted: 0 },
        select: { username: true, real_name: true },
      }),
      client.sys_dept.findFirst({
        where: { dept_id: deptId, tenant_id: tenantId, is_deleted: 0 },
        select: { leader: true, leader_id: true },
      }),
    ]);

    if (!user || !dept) return false;

    // ⭐ 优先用 UUID 强关联
    if (dept.leader_id) {
      return dept.leader_id === userId;
    }

    // 兜底：字符串匹配（兼容旧数据）
    if (!dept.leader) return false;
    const leader = dept.leader.trim();
    return leader === user.username || leader === user.real_name;
  }

  /**
   * 判断用户是否为超级管理员（用于兜底放行）
   */
  async isSuperAdmin(
    userId: string,
    tenantId: string,
    tx?: TxClient,
  ): Promise<boolean> {
    const client = tx ?? prisma;
    const row = await client.sys_user_role.findFirst({
      where: {
        user_id: userId,
        tenant_id: tenantId,
        role: { role_code: "SUPER_ADMIN", is_deleted: 0 },
      },
      select: { id: true },
    });
    return !!row;
  }
  async findLeaderDeptIds(
    userId: string,
    tenantId: string,
    tx?: TxClient,
  ): Promise<string[]> {
    const client = tx ?? prisma;

    // 先用 leader_id 精确查
    const byId = await client.sys_dept.findMany({
      where: {
        tenant_id: tenantId,
        is_deleted: 0,
        status: "1",
        leader_id: userId,
      },
      select: { dept_id: true },
    });

    // 兜底：用字符串匹配
    const user = await client.sys_user.findFirst({
      where: { user_id: userId, tenant_id: tenantId, is_deleted: 0 },
      select: { username: true, real_name: true },
    });

    const byText = user
      ? await client.sys_dept.findMany({
          where: {
            tenant_id: tenantId,
            is_deleted: 0,
            status: "1",
            leader_id: null,
            leader: {
              in: [user.username, user.real_name].filter(Boolean) as string[],
            },
          },
          select: { dept_id: true },
        })
      : [];

    return [...new Set([...byId, ...byText].map((d) => d.dept_id))];
  }
  /**
   * 计算审批链 —— 从发起人的「直接审批人」开始
   * 规则：
   *   发起人是本部门负责人 → 从上级部门开始
   *   发起人不是本部门负责人 → 从本部门开始
   */
  async computeApprovalChain(
    userId: string,
    tenantId: string,
  ): Promise<{ dept_id: string; dept_name: string }[]> {
    const userDept = await prisma.sys_user_dept.findFirst({
      where: {
        user_id: userId,
        tenant_id: tenantId,
        is_primary: 1,
      },
    });
    if (!userDept) throw new AppError("未找到用户所属部门", 400001, 400);

    const fullChain = await this.getDeptHierarchy(userDept.dept_id, tenantId);
    if (fullChain.length === 0) throw new AppError("部门层级为空", 400001, 400);

    const isLeader = await this.isUserLeaderOfDept(
      userId,
      userDept.dept_id,
      tenantId,
    );

    return isLeader ? fullChain.slice(1) : fullChain;
  }
  async getNextSequence(requestId: string, tenantId: string): Promise<number> {
    const maxNode = await prisma.sys_approval_node.findFirst({
      where: { request_id: requestId, tenant_id: tenantId },
      orderBy: { sequence: "desc" },
      select: { sequence: true },
    });
    return (maxNode?.sequence ?? 0) + 1;
  }
  async appendNode(
    data: {
      request_id: string;
      tenant_id: string;
      dept_id: string;
      sequence: number;
      round: number;
      created_by: string;
    },
    tx?: TxClient,
  ) {
    const client = tx ?? prisma;
    return client.sys_approval_node.create({
      data: {
        tenant_id: data.tenant_id,
        request_id: data.request_id,
        dept_id: data.dept_id,
        sequence: data.sequence,
        round: data.round,
        status: NodeStatus.PENDING,
        is_current: 1,
        is_deleted: 0,
        created_by: data.created_by,
        updated_by: data.created_by,
      },
    });
  }
  async appendLog(data: ApprovalLogInput, tx?: TxClient) {
    const client = tx ?? prisma;
    return client.sys_approval_log.create({
      data: {
        tenant_id: data.tenant_id,
        request_id: data.request_id,
        operator_id: data.operator_id,
        operator_name: data.operator_name,
        action: data.action,
        from_status: data.from_status ?? null,
        to_status: data.to_status ?? null,
        remark: data.remark ?? null,
        reason_type: data.reason_type ?? null,
        metadata: data.metadata ?? null,
        created_at: new Date(),
        created_by: data.operator_id,
      },
    });
  }

  /**
   * 获取操作人名字（username 或 real_name）
   */
  async getUserDisplayName(
    userId: string,
    tenantId: string,
    tx?: TxClient,
  ): Promise<string> {
    const client = tx ?? prisma;
    const user = await client.sys_user.findFirst({
      where: { user_id: userId, tenant_id: tenantId, is_deleted: 0 },
      select: { username: true, real_name: true },
    });
    return user?.real_name ?? user?.username ?? "未知用户";
  }
}
