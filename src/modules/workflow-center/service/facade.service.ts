import { ApprovalRequestRepository } from "@/modules/approval/repository/request.repository.js";
import { ApprovalRequestService } from "@/modules/approval/service/request.service.js";
import { ApprovalFlowService } from "@/modules/approval/service/flow.service.js";
import { NodeStatus } from "@/modules/approval/types.js";
import { WfTaskService } from "@/modules/workflow/service/task.service.js";
import { WfInstanceService } from "@/modules/workflow/service/instance.service.js";
import { prisma } from "@/config/database.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import type { FlowDetailDTO, FlowLogDTO, TodoItemDTO } from "../types.js";
import type {
  CenterTodoQueryDTO,
  CenterCompleteDTO,
  CenterBatchCompleteDTO,
  CenterDetailQueryDTO,
  CenterInitiatedQueryDTO,
  CenterDoneQueryDTO,
} from "../schema.js";
import dayjs from "dayjs";

const APPROVAL_DEF_KEY = "SYSTEM_APPROVAL_DEPT_CHAIN";

export class WorkflowCenterFacade {
  private approvalRepo = new ApprovalRequestRepository();
  private approvalService = new ApprovalRequestService(this.approvalRepo);
  private approvalFlowService = new ApprovalFlowService(this.approvalRepo);
  private wfTaskService = new WfTaskService();
  private wfInstanceService = new WfInstanceService();

  /* ============================================================
   * 统一待办
   * ============================================================ */
  async listTodo(params: CenterTodoQueryDTO, userId: string, tenantId: string) {
    const { source, keyword, priority, pageNum, pageSize } = params;

    if (source === "approval") {
      return this.listApprovalTodo({
        userId,
        tenantId,
        keyword,
        pageNum,
        pageSize,
      });
    }
    if (source === "workflow") {
      return this.listWorkflowTodo({
        userId,
        tenantId,
        keyword,
        priority,
        pageNum,
        pageSize,
      });
    }

    // 双源合并
    const halfSize = Math.ceil(pageSize / 2) * pageNum;
    const [approvalRes, workflowRes] = await Promise.all([
      this.listApprovalTodo({
        userId,
        tenantId,
        keyword,
        pageNum: 1,
        pageSize: halfSize,
      }),
      this.listWorkflowTodo({
        userId,
        tenantId,
        keyword,
        priority,
        pageNum: 1,
        pageSize: halfSize,
      }),
    ]);

    const merged = [...approvalRes.list, ...workflowRes.list].sort(
      (a, b) => dayjs(b.createdAt).unix() - dayjs(a.createdAt).unix(),
    );

    const total = approvalRes.total + workflowRes.total;
    const start = (pageNum - 1) * pageSize;
    const list = merged.slice(start, start + pageSize);

    return { list, total };
  }

  private async listApprovalTodo(params: {
    userId: string;
    tenantId: string;
    keyword?: string;
    pageNum: number;
    pageSize: number;
  }) {
    const { userId, tenantId, keyword, pageNum, pageSize } = params;

    const isSuper = await this.approvalRepo.isSuperAdmin(userId, tenantId);
    const deptIds = isSuper
      ? undefined
      : await this.approvalRepo.findLeaderDeptIds(userId, tenantId);

    if (!isSuper && (!deptIds || deptIds.length === 0)) {
      return { list: [] as TodoItemDTO[], total: 0 };
    }

    const where: any = {
      tenant_id: tenantId,
      status: NodeStatus.PENDING,
      is_current: 1,
      is_deleted: 0,
    };
    if (deptIds) where.dept_id = { in: deptIds };

    if (keyword) {
      const requests = await prisma.sys_approval_request.findMany({
        where: {
          tenant_id: tenantId,
          is_deleted: 0,
          title: { contains: keyword },
        },
        select: { request_id: true },
        take: 500,
      });
      const ids = requests.map((r) => r.request_id);
      if (ids.length === 0) return { list: [], total: 0 };
      where.request_id = { in: ids };
    }

    const [nodes, total] = await Promise.all([
      prisma.sys_approval_node.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      prisma.sys_approval_node.count({ where }),
    ]);

    if (nodes.length === 0) return { list: [], total };

    const reqIds = [...new Set(nodes.map((n) => n.request_id))];
    const deptIdList = [...new Set(nodes.map((n) => n.dept_id))];

    const [requests, deptMap] = await Promise.all([
      prisma.sys_approval_request.findMany({
        where: { request_id: { in: reqIds }, tenant_id: tenantId },
        select: {
          request_id: true,
          title: true,
          applicant_id: true,
          created_at: true,
        },
      }),
      this.approvalRepo.findDeptNames(deptIdList, tenantId),
    ]);

    const reqMap = new Map(requests.map((r) => [r.request_id, r]));
    const applicantIds = [...new Set(requests.map((r) => r.applicant_id))];
    const userMap = await this.approvalRepo.findUserNames(
      applicantIds,
      tenantId,
    );

    const list: TodoItemDTO[] = nodes.map((n) => {
      const req = reqMap.get(n.request_id);
      return {
        source: "approval",
        id: n.node_id,
        instanceId: n.request_id,
        title: req?.title ?? "（无标题）",
        nodeName: deptMap.get(n.dept_id) ?? "未知部门",
        defKey: APPROVAL_DEF_KEY,
        initiatorId: req?.applicant_id ?? "",
        initiatorName: userMap.get(req?.applicant_id ?? "") ?? "",
        createdAt: dayjs(n.created_at).format("YYYY-MM-DD HH:mm:ss"),
        dueAt: null,
        status: n.status,
      };
    });

    return { list, total };
  }

  private async listWorkflowTodo(params: {
    userId: string;
    tenantId: string;
    keyword?: string;
    priority?: number;
    pageNum: number;
    pageSize: number;
  }) {
    const result = await this.wfTaskService.todo({
      tenantId: params.tenantId,
      userId: params.userId,
      keyword: params.keyword,
      priority: params.priority,
      pageNum: params.pageNum,
      pageSize: params.pageSize,
    });

    const list: TodoItemDTO[] = result.list.map((t: any) => ({
      source: "workflow",
      id: t.task_id,
      instanceId: t.instance_id,
      title: t.instance?.title ?? "（无标题）",
      nodeName: t.node_name,
      defKey: t.instance?.def_key ?? "",
      initiatorId: t.instance?.initiator_id ?? "",
      createdAt: t.created_at,
      dueAt: t.due_at,
      priority: t.priority ?? 0,
      status: t.status,
    }));

    return { list, total: result.total };
  }

  /* ============================================================
   * 统一完成
   * ============================================================ */
  async complete(params: CenterCompleteDTO, userId: string, tenantId: string) {
    if (params.source === "approval") {
      return this.completeApproval(params, userId, tenantId);
    }
    if (params.source === "workflow") {
      return this.completeWorkflow(params, userId, tenantId);
    }
    throw new AppError("未知的待办来源", 400001, 400);
  }

  private async completeApproval(
    params: CenterCompleteDTO,
    userId: string,
    tenantId: string,
  ) {
    const node = await prisma.sys_approval_node.findFirst({
      where: { node_id: params.id, tenant_id: tenantId, is_deleted: 0 },
    });
    if (!node) throw new AppError("审批节点不存在", 404001, 404);

    if (params.action === "approve") {
      return this.approvalService.approveRequest(
        node.request_id,
        userId,
        tenantId,
        {
          remark: params.comment,
        },
      );
    }
    return this.approvalService.rejectRequest(
      node.request_id,
      userId,
      tenantId,
      {
        reasonType: params.reasonType ?? "other",
        remark: params.comment ?? "未填写",
      },
    );
  }

  private async completeWorkflow(
    params: CenterCompleteDTO,
    userId: string,
    tenantId: string,
  ) {
    return this.wfTaskService.complete(params.id, tenantId, userId, {
      action: params.action,
      comment: params.comment,
    });
  }

  /* ============================================================
   * 批量完成
   * ============================================================ */
  async batchComplete(
    params: CenterBatchCompleteDTO,
    userId: string,
    tenantId: string,
  ) {
    let success = 0;
    let failed = 0;
    const errors: Array<{ id: string; source: string; error: string }> = [];

    for (const item of params.items) {
      try {
        await this.complete(
          {
            source: item.source,
            id: item.id,
            action: params.action,
            comment: params.comment,
          },
          userId,
          tenantId,
        );
        success++;
      } catch (err: any) {
        failed++;
        errors.push({ id: item.id, source: item.source, error: err.message });
        logger.warn(
          { err, id: item.id, source: item.source },
          "[workflow-center] 批量完成失败",
        );
      }
    }

    return { success, failed, errors };
  }

  /* ============================================================
   * 统一详情
   * ============================================================ */
  async getDetail(
    params: CenterDetailQueryDTO,
    tenantId: string,
  ): Promise<FlowDetailDTO> {
    if (params.source === "approval") {
      return this.getApprovalDetail(params.id, tenantId);
    }
    if (params.source === "workflow") {
      return this.getWorkflowDetail(params.id, tenantId);
    }
    throw new AppError("未知的来源", 400001, 400);
  }

  private async getApprovalDetail(
    requestId: string,
    tenantId: string,
  ): Promise<FlowDetailDTO> {
    const detail = await this.approvalFlowService.getFlowDetail(
      requestId,
      tenantId,
    );
    if (!detail) throw new AppError("审批流程不存在", 404001, 404);

    const logs = await prisma.sys_approval_log.findMany({
      where: { request_id: requestId, tenant_id: tenantId },
      orderBy: { created_at: "asc" },
    });

    // ⭐ fallback：若 applicant_name 为空，主动查用户表
    let initiatorName = detail.applicantName;
    if (!initiatorName && detail.applicantId) {
      const user = await prisma.sys_user.findUnique({
        where: { user_id: detail.applicantId },
        select: { real_name: true, username: true },
      });
      initiatorName = user?.real_name ?? user?.username ?? null;
    }

    return {
      source: "approval",
      id: detail.requestId,
      title: detail.title,
      status: detail.status,
      defKey: APPROVAL_DEF_KEY,
      initiatorId: detail.applicantId,
      initiatorName: initiatorName ?? undefined,
      createdAt:
        dayjs(detail.createdAt).format("YYYY-MM-DD HH:mm:ss") ?? undefined,
      updatedAt:
        dayjs(detail.updatedAt).format("YYYY-MM-DD HH:mm:ss") ?? undefined,
      nodes: detail.nodes,
      formData: (detail as any).form_data ?? {},
      logs: logs.map<FlowLogDTO>((l) => ({
        id: l.log_id,
        action: l.action,
        actionLabel: this.approvalActionLabel(l.action),
        operatorId: l.operator_id,
        operatorName: l.operator_name,
        remark: l.remark,
        createdAt:
          l.created_at instanceof Date
            ? l.created_at.toISOString()
            : (l.created_at as any),
      })),
    };
  }

  private async getWorkflowDetail(
    instanceId: string,
    tenantId: string,
  ): Promise<FlowDetailDTO> {
    const detail = await this.wfInstanceService.detail(instanceId, tenantId);
    let initiatorName = detail.initiator_name;
    if (!initiatorName && detail.initiator_id) {
      const user = await prisma.sys_user.findUnique({
        where: { user_id: detail.initiator_id },
        select: { real_name: true, username: true },
      });
      initiatorName = user?.real_name ?? user?.username ?? null;
    }
    const nodeStatus: Record<string, string> = {};
    const activeNodes = (detail.active_nodes as string[]) ?? [];
    const completedSet = new Set(
      detail.history
        .filter((h) => h.event_type === "complete")
        .map((h) => h.node_id),
    );
    const rejectedSet = new Set(
      detail.history
        .filter((h) => h.event_type === "reject")
        .map((h) => h.node_id),
    );

    const defJson: any = detail.definition ?? {};
    for (const node of defJson.nodes ?? []) {
      if (rejectedSet.has(node.id)) nodeStatus[node.id] = "rejected";
      else if (activeNodes.includes(node.id)) nodeStatus[node.id] = "active";
      else if (completedSet.has(node.id)) nodeStatus[node.id] = "completed";
      else nodeStatus[node.id] = "pending";
    }

    return {
      source: "workflow",
      id: detail.instance_id,
      title: detail.title,
      status: detail.status,
      defKey: detail.def_key,
      initiatorId: detail.initiator_id,
      initiatorName: initiatorName ?? undefined,
      createdAt:
        dayjs(detail.start_at).format("YYYY-MM-DD HH:mm:ss") ?? undefined,
      updatedAt:
        dayjs(detail.updated_at).format("YYYY-MM-DD HH:mm:ss") ?? undefined,
      definition: detail.definition,
      definitionXml: detail.definition_xml,
      nodeStatus,
      formData: (detail.variables as Record<string, unknown>) ?? {},
      logs: detail.history.map<FlowLogDTO>((h) => ({
        id: h.history_id,
        action: h.event_type,
        nodeName: h.node_name,
        operatorId: h.operator_id ?? undefined,
        operatorName: h.operator_name ?? undefined,
        remark: h.comment,
        createdAt:
          dayjs(h.created_at).format("YYYY-MM-DD HH:mm:ss") ?? undefined,
      })),
    };
  }

  private approvalActionLabel(action: string): string {
    const map: Record<string, string> = {
      SUBMIT: "提交",
      APPROVE: "通过",
      REJECT: "驳回",
      RESUBMIT: "重新提交",
    };
    return map[action] ?? action;
  }
  /* ============================================================
   * 我发起的
   * ============================================================ */
  async listInitiated(
    params: CenterInitiatedQueryDTO,
    userId: string,
    tenantId: string,
  ): Promise<{ list: TodoItemDTO[]; total: number }> {
    const { source, keyword, defKey, status, pageNum, pageSize } = params;

    // 单源
    if (source === "approval") {
      return this.listApprovalInitiated({
        userId,
        tenantId,
        keyword,
        status,
        pageNum,
        pageSize,
      });
    }
    if (source === "workflow") {
      return this.listWorkflowInitiated({
        userId,
        tenantId,
        keyword,
        defKey,
        status,
        pageNum,
        pageSize,
      });
    }

    // 双源合并
    const halfSize = Math.ceil(pageSize / 2) * pageNum;
    const [approvalRes, workflowRes] = await Promise.all([
      this.listApprovalInitiated({
        userId,
        tenantId,
        keyword,
        status,
        pageNum: 1,
        pageSize: halfSize,
      }),
      this.listWorkflowInitiated({
        userId,
        tenantId,
        keyword,
        defKey,
        status,
        pageNum: 1,
        pageSize: halfSize,
      }),
    ]);

    const merged = [...approvalRes.list, ...workflowRes.list].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const total = approvalRes.total + workflowRes.total;
    const start = (pageNum - 1) * pageSize;
    const list = merged.slice(start, start + pageSize);

    return { list, total };
  }

  private async listApprovalInitiated(params: {
    userId: string;
    tenantId: string;
    keyword?: string;
    status?: string;
    pageNum: number;
    pageSize: number;
  }): Promise<{ list: TodoItemDTO[]; total: number }> {
    const { userId, tenantId, keyword, status, pageNum, pageSize } = params;

    const where: any = {
      tenant_id: tenantId,
      applicant_id: userId,
      is_deleted: 0,
    };
    if (keyword) where.title = { contains: keyword };
    if (status) where.status = status;

    const [rows, total] = await Promise.all([
      prisma.sys_approval_request.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      prisma.sys_approval_request.count({ where }),
    ]);

    if (rows.length === 0) return { list: [], total };

    // 查当前部门名 + 发起人
    const deptIds = [
      ...new Set(rows.map((r) => r.current_dept_id).filter(Boolean)),
    ];
    const deptMap = await this.approvalRepo.findDeptNames(
      deptIds as string[],
      tenantId,
    );

    const list: TodoItemDTO[] = rows.map((r) => ({
      source: "approval",
      id: r.request_id,
      instanceId: r.request_id,
      title: r.title,
      nodeName: deptMap.get(r.current_dept_id) ?? "—",
      defKey: APPROVAL_DEF_KEY,
      initiatorId: r.applicant_id,
      initiatorName: undefined, // 前端会通过 detail 拉
      createdAt: dayjs(r.created_at).format("YYYY-MM-DD HH:mm:ss"),
      dueAt: null,
      priority: 0,
      status: r.status,
    }));

    return { list, total };
  }

  private async listWorkflowInitiated(params: {
    userId: string;
    tenantId: string;
    keyword?: string;
    defKey?: string;
    status?: string;
    pageNum: number;
    pageSize: number;
  }): Promise<{ list: TodoItemDTO[]; total: number }> {
    const { userId, tenantId, keyword, defKey, status, pageNum, pageSize } =
      params;

    const where: any = {
      tenant_id: tenantId,
      initiator_id: userId,
      is_deleted: 0,
    };
    if (keyword) where.title = { contains: keyword };
    if (defKey) where.def_key = defKey;
    if (status) where.status = status;

    const [rows, total] = await Promise.all([
      prisma.wf_instance.findMany({
        where,
        orderBy: { start_at: "desc" },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        select: {
          instance_id: true,
          title: true,
          def_key: true,
          status: true,
          start_at: true,
          active_nodes: true,
          initiator_id: true,
        },
      }),
      prisma.wf_instance.count({ where }),
    ]);

    if (rows.length === 0) return { list: [], total };

    // 查当前活跃节点名
    const defKeys = [...new Set(rows.map((r) => r.def_key))];
    const defs = await prisma.wf_definition.findMany({
      where: {
        tenant_id: tenantId,
        def_key: { in: defKeys },
        status: "1",
        is_deleted: 0,
      },
      select: { def_key: true, definition: true, version: true },
      orderBy: { version: "desc" },
    });
    const defMap = new Map(defs.map((d) => [d.def_key, d]));

    const list: TodoItemDTO[] = rows.map((r) => {
      const activeNodes = (r.active_nodes as string[]) ?? [];
      const def = defMap.get(r.def_key);
      const nodes = ((def?.definition as any)?.nodes ?? []) as Array<{
        id: string;
        name?: string;
      }>;
      const currentNode = nodes.find((n) => activeNodes.includes(n.id));

      return {
        source: "workflow",
        id: r.instance_id,
        instanceId: r.instance_id,
        title: r.title,
        nodeName: currentNode?.name ?? "—",
        defKey: r.def_key,
        initiatorId: r.initiator_id,
        initiatorName: undefined,
        createdAt: dayjs(r.start_at).format("YYYY-MM-DD HH:mm:ss"),
        dueAt: null,
        priority: 0,
        status: r.status,
      };
    });

    return { list, total };
  }
  /* ============================================================
   * 我的已办
   * ============================================================ */
  async listDone(
    params: CenterDoneQueryDTO,
    userId: string,
    tenantId: string,
  ): Promise<{ list: TodoItemDTO[]; total: number }> {
    const { source, keyword, defKey, pageNum, pageSize } = params;

    if (source === "approval") {
      return this.listApprovalDone({
        userId,
        tenantId,
        keyword,
        pageNum,
        pageSize,
      });
    }
    if (source === "workflow") {
      return this.listWorkflowDone({
        userId,
        tenantId,
        keyword,
        defKey,
        pageNum,
        pageSize,
      });
    }

    // 双源合并
    const halfSize = Math.ceil(pageSize / 2) * pageNum;
    const [approvalRes, workflowRes] = await Promise.all([
      this.listApprovalDone({
        userId,
        tenantId,
        keyword,
        pageNum: 1,
        pageSize: halfSize,
      }),
      this.listWorkflowDone({
        userId,
        tenantId,
        keyword,
        defKey,
        pageNum: 1,
        pageSize: halfSize,
      }),
    ]);

    const merged = [...approvalRes.list, ...workflowRes.list].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const total = approvalRes.total + workflowRes.total;
    const start = (pageNum - 1) * pageSize;
    const list = merged.slice(start, start + pageSize);

    return { list, total };
  }

  private async listApprovalDone(params: {
    userId: string;
    tenantId: string;
    keyword?: string;
    pageNum: number;
    pageSize: number;
  }): Promise<{ list: TodoItemDTO[]; total: number }> {
    const { userId, tenantId, keyword, pageNum, pageSize } = params;

    // 已办 = 该用户审批过的节点（approver_id = userId 且节点已完成）
    const where: any = {
      tenant_id: tenantId,
      approver_id: userId,
      is_deleted: 0,
      status: { in: ["1", "2"] }, // 已通过 / 已驳回
    };

    const [nodes, total] = await Promise.all([
      prisma.sys_approval_node.findMany({
        where,
        orderBy: { approved_at: "desc" },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      prisma.sys_approval_node.count({ where }),
    ]);

    if (nodes.length === 0) return { list: [], total };

    // 批量查 request + dept
    const reqIds = [...new Set(nodes.map((n) => n.request_id))];
    const deptIds = [...new Set(nodes.map((n) => n.dept_id))];

    const [requests, deptMap] = await Promise.all([
      prisma.sys_approval_request.findMany({
        where: { request_id: { in: reqIds }, tenant_id: tenantId },
        select: {
          request_id: true,
          title: true,
          applicant_id: true,
          created_at: true,
        },
      }),
      this.approvalRepo.findDeptNames(deptIds, tenantId),
    ]);
    const reqMap = new Map(requests.map((r) => [r.request_id, r]));

    // 关键词过滤（内存）
    let filtered = nodes;
    if (keyword) {
      filtered = nodes.filter((n) => {
        const req = reqMap.get(n.request_id);
        return req?.title?.includes(keyword);
      });
    }

    const list: TodoItemDTO[] = filtered.map((n) => {
      const req = reqMap.get(n.request_id);
      return {
        source: "approval",
        id: n.node_id,
        instanceId: n.request_id,
        title: req?.title ?? "（无标题）",
        nodeName: deptMap.get(n.dept_id) ?? "—",
        defKey: APPROVAL_DEF_KEY,
        initiatorId: req?.applicant_id ?? "",
        initiatorName: undefined,
        createdAt: dayjs(n.approved_at ?? n.updated_at).format(
          "YYYY-MM-DD HH:mm:ss",
        ),
        dueAt: null,
        priority: 0,
        status: n.status,
      };
    });

    return { list, total };
  }

  private async listWorkflowDone(params: {
    userId: string;
    tenantId: string;
    keyword?: string;
    defKey?: string;
    pageNum: number;
    pageSize: number;
  }): Promise<{ list: TodoItemDTO[]; total: number }> {
    const { userId, tenantId, keyword, defKey, pageNum, pageSize } = params;

    const where: any = {
      tenant_id: tenantId,
      is_deleted: 0,
      status: "1", // 已完成
      OR: [
        { assignee_id: userId },
        { completed_ids: { array_contains: userId } },
      ],
    };

    if (keyword || defKey) {
      where.instance = {
        ...(keyword ? { title: { contains: keyword } } : {}),
        ...(defKey ? { def_key: defKey } : {}),
      };
    }

    const [rows, total] = await Promise.all([
      prisma.wf_task.findMany({
        where,
        include: {
          instance: {
            select: {
              instance_id: true,
              title: true,
              def_key: true,
              initiator_id: true,
            },
          },
        },
        orderBy: { completed_at: "desc" },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      prisma.wf_task.count({ where }),
    ]);

    const list: TodoItemDTO[] = rows.map((t: any) => ({
      source: "workflow",
      id: t.task_id,
      instanceId: t.instance_id,
      title: t.instance?.title ?? "（无标题）",
      nodeName: t.node_name,
      defKey: t.instance?.def_key ?? "",
      initiatorId: t.instance?.initiator_id ?? "",
      initiatorName: undefined,
      createdAt: dayjs(t.completed_at ?? t.updated_at).format(
        "YYYY-MM-DD HH:mm:ss",
      ),
      dueAt: dayjs(t.due_at).format("YYYY-MM-DD HH:mm:ss"),
      priority: t.priority ?? 0,
      status: t.status,
    }));

    return { list, total };
  }
  /**
   * 批量补全 initiatorName
   */
  private async enrichInitiatorNames(
    list: TodoItemDTO[],
    tenantId: string,
  ): Promise<TodoItemDTO[]> {
    const userIds = [
      ...new Set(list.map((i) => i.initiatorId).filter(Boolean)),
    ];
    if (userIds.length === 0) return list;

    const users = await prisma.sys_user.findMany({
      where: { user_id: { in: userIds }, tenant_id: tenantId, is_deleted: 0 },
      select: { user_id: true, real_name: true, username: true },
    });
    const userMap = new Map(
      users.map((u) => [u.user_id, u.real_name ?? u.username]),
    );

    return list.map((item) => ({
      ...item,
      initiatorName:
        item.initiatorName ?? userMap.get(item.initiatorId) ?? undefined,
    }));
  }
}

export const workflowCenterFacade = new WorkflowCenterFacade();
