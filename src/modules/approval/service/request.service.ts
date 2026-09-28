import { prisma } from "@/config/index.js";
import { BaseService, withLock } from "@/core/index.js";
import { AppError, AuthorizationError, NotFoundError } from "@/core/errors.js";
import { ApprovalRequestRepository } from "../repository/request.repository.js";
import { ApprovalStatus, NodeStatus, ApprovalAction } from "../types.js";
import type { CreateApprovalDTO, ApproveDTO, RejectDTO } from "../schema.js";

const LOCK_TTL = 30;

export class ApprovalRequestService extends BaseService<ApprovalRequestRepository> {
  constructor(repository: ApprovalRequestRepository) {
    super(repository);
  }

  /**
   * 创建申请
   */
  async createRequest(
    userId: string,
    tenantId: string,
    dto: CreateApprovalDTO,
  ) {
    // 1. 计算审批链（从发起人的直接审批人开始）
    const chain = await this.repository.computeApprovalChain(userId, tenantId);
    if (chain.length === 0) {
      throw new AppError(
        "您当前处于顶层部门且为本部门负责人，无上级可审批",
        400001,
        400,
      );
    }

    // 2. 事务：创建主表 + 第一个节点
    return prisma.$transaction(async (tx) => {
      const request = await tx.sys_approval_request.create({
        data: {
          tenant_id: tenantId,
          title: dto.title,
          content: dto.content ?? null,
          form_data: (dto.formData ?? {}) as never,
          applicant_id: userId,
          current_dept_id: chain[0].dept_id,
          status: ApprovalStatus.PENDING,
          is_deleted: 0,
          created_by: userId,
          updated_by: userId,
        },
      });

      // ⭐ 只创建第一个节点
      await tx.sys_approval_node.create({
        data: {
          tenant_id: tenantId,
          request_id: request.request_id,
          dept_id: chain[0].dept_id,
          sequence: 1,
          round: 1,
          status: NodeStatus.PENDING,
          is_current: 1,
          is_deleted: 0,
          created_by: userId,
          updated_by: userId,
        },
      });
      const operatorName = await this.repository.getUserDisplayName(
        userId,
        tenantId,
        tx,
      );
      await this.repository.appendLog(
        {
          tenant_id: tenantId,
          request_id: request.request_id,
          operator_id: userId,
          operator_name: operatorName,
          action: ApprovalAction.SUBMIT,
          from_status: null,
          to_status: ApprovalStatus.PENDING,
          remark: "提交审批申请",
          metadata: {
            title: dto.title,
            firstApproverDept: chain[0].dept_name,
            chainLength: chain.length,
          },
        },
        tx,
      );
      return request;
    });
  }

  /**
   * 审批通过
   */
  async approveRequest(
    requestId: string,
    userId: string,
    tenantId: string,
    dto: ApproveDTO,
  ) {
    const result = await withLock(
      `approval:lock:${requestId}`,
      LOCK_TTL,
      async () =>
        prisma.$transaction(async (tx) => {
          const request = await this.assertPending(requestId, tenantId, tx);
          const currentNode = await this.assertCurrentNode(
            requestId,
            tenantId,
            userId,
            tx,
          );

          // 1. 标记当前节点为已通过
          await tx.sys_approval_node.update({
            where: { node_id: currentNode.node_id },
            data: {
              status: NodeStatus.APPROVED,
              approver_id: userId,
              approved_at: new Date(),
              is_current: 0,
              updated_by: userId,
            },
          });

          // 2. 计算完整审批链，找到当前节点在链中的位置
          const chain = await this.repository.computeApprovalChain(
            request.applicant_id,
            tenantId,
          );

          // 当前节点在链中的索引
          const currentIdx = chain.findIndex(
            (c) => c.dept_id === currentNode.dept_id,
          );

          // 3. 判断是否还有下一个审批部门
          const nextDept =
            currentIdx >= 0 && currentIdx + 1 < chain.length
              ? chain[currentIdx + 1]
              : null;
          let nextStatus = ApprovalStatus.PENDING;
          if (nextDept) {
            // ⭐ 动态创建下一个节点
            const nextSeq = await this.repository.getNextSequence(
              requestId,
              tenantId,
            );
            await tx.sys_approval_node.create({
              data: {
                tenant_id: tenantId,
                request_id: requestId,
                dept_id: nextDept.dept_id,
                sequence: nextSeq,
                round: currentNode.round,
                status: NodeStatus.PENDING,
                is_current: 1,
                is_deleted: 0,
                created_by: userId,
                updated_by: userId,
              },
            });

            await tx.sys_approval_request.update({
              where: { request_id: requestId },
              data: { current_dept_id: nextDept.dept_id, updated_by: userId },
            });
          } else {
            // 已到顶层，全部通过
            nextStatus = ApprovalStatus.APPROVED;
            await tx.sys_approval_request.update({
              where: { request_id: requestId },
              data: { status: nextStatus, updated_by: userId },
            });
          }
          const operatorName = await this.repository.getUserDisplayName(
            userId,
            tenantId,
            tx,
          );
          await this.repository.appendLog(
            {
              tenant_id: tenantId,
              request_id: requestId,
              operator_id: userId,
              operator_name: operatorName,
              action: ApprovalAction.APPROVE,
              from_status: ApprovalStatus.PENDING,
              to_status: nextStatus,
              remark: dto.remark ?? "同意",
              metadata: {
                dept: chain[currentIdx]?.dept_name ?? null,
                round: currentNode.round,
                sequence: currentNode.sequence,
                nextDept: nextDept?.dept_name ?? null,
                isFinished: !nextDept,
              },
            },
            tx,
          );
          return {
            requestId,
            action: ApprovalAction.APPROVE,
            remark: dto.remark ?? null,
          };
        }),
    );

    if (!result) throw new AppError("系统繁忙，请稍后重试", 429001, 429);
    return result;
  }

  /**
   * 审批驳回
   */
  async rejectRequest(
    requestId: string,
    userId: string,
    tenantId: string,
    dto: RejectDTO,
  ) {
    const result = await withLock(
      `approval:lock:${requestId}`,
      LOCK_TTL,
      async () =>
        prisma.$transaction(async (tx) => {
          await this.assertPending(requestId, tenantId, tx);
          const currentNode = await this.assertCurrentNode(
            requestId,
            tenantId,
            userId,
            tx,
          );

          // 1. 当前节点 → 已驳回
          await tx.sys_approval_node.update({
            where: { node_id: currentNode.node_id },
            data: {
              status: NodeStatus.REJECTED,
              approver_id: userId,
              reject_reason_type: dto.reasonType,
              reject_reason: dto.remark,
              is_current: 0,
              updated_by: userId,
            },
          });

          // 2. 主表 → 已驳回
          await tx.sys_approval_request.update({
            where: { request_id: requestId },
            data: { status: ApprovalStatus.REJECTED, updated_by: userId },
          });
          const operatorName = await this.repository.getUserDisplayName(
            userId,
            tenantId,
            tx,
          );
          await this.repository.appendLog(
            {
              tenant_id: tenantId,
              request_id: requestId,
              operator_id: userId,
              operator_name: operatorName,
              action: ApprovalAction.REJECT,
              from_status: ApprovalStatus.PENDING,
              to_status: ApprovalStatus.REJECTED,
              reason_type: dto.reasonType,
              remark: dto.remark,
              metadata: {
                round: currentNode.round,
                sequence: currentNode.sequence,
                rejectReasonType: dto.reasonType,
              },
            },
            tx,
          );
          return {
            requestId,
            action: ApprovalAction.REJECT,
            remark: dto.remark,
            reasonType: dto.reasonType,
          };
        }),
    );

    if (!result) throw new AppError("系统繁忙，请稍后重试", 429001, 429);
    return result;
  }
  /**
   * 重新提交
   */
  async resubmitRequest(
    requestId: string,
    userId: string,
    tenantId: string,
    dto: CreateApprovalDTO,
  ) {
    const result = await withLock(
      `approval:lock:${requestId}`,
      LOCK_TTL,
      async () =>
        prisma.$transaction(async (tx) => {
          const request = await tx.sys_approval_request.findFirst({
            where: {
              request_id: requestId,
              tenant_id: tenantId,
              is_deleted: 0,
            },
          });
          if (!request) throw new NotFoundError("审批申请不存在");
          if (request.status !== ApprovalStatus.REJECTED)
            throw new AppError("只有被驳回的申请才能重新提交", 400004, 400);
          if (request.applicant_id !== userId)
            throw new AuthorizationError("只有申请人本人可以重新提交");

          // 1. 计算最新的 round
          const maxRoundNode = await tx.sys_approval_node.findFirst({
            where: { request_id: requestId, tenant_id: tenantId },
            orderBy: { round: "desc" },
            select: { round: true },
          });
          const newRound = (maxRoundNode?.round ?? 1) + 1;

          // 2. 重新计算审批链
          const chain = await this.repository.computeApprovalChain(
            request.applicant_id,
            tenantId,
          );
          if (chain.length === 0) {
            throw new AppError("无上级可审批", 400001, 400);
          }

          // 3. 获取下一个 sequence（在最大 sequence 上继续 +1）
          const maxSeqNode = await tx.sys_approval_node.findFirst({
            where: { request_id: requestId, tenant_id: tenantId },
            orderBy: { sequence: "desc" },
            select: { sequence: true },
          });
          const nextSeq = (maxSeqNode?.sequence ?? 0) + 1;

          // 4. ⭐ 只创建新一轮的第一个节点
          await tx.sys_approval_node.create({
            data: {
              tenant_id: tenantId,
              request_id: requestId,
              dept_id: chain[0].dept_id,
              sequence: nextSeq,
              round: newRound,
              status: NodeStatus.PENDING,
              is_current: 1,
              is_deleted: 0,
              created_by: userId,
              updated_by: userId,
            },
          });

          // 5. 主表更新
          await tx.sys_approval_request.update({
            where: { request_id: requestId },
            data: {
              title: dto.title,
              content: dto.content ?? null,
              form_data: (dto.formData ?? {}) as never,
              status: ApprovalStatus.PENDING,
              current_dept_id: chain[0].dept_id,
              updated_by: userId,
            },
          });
          const operatorName = await this.repository.getUserDisplayName(
            userId,
            tenantId,
            tx,
          );
          await this.repository.appendLog(
            {
              tenant_id: tenantId,
              request_id: requestId,
              operator_id: userId,
              operator_name: operatorName,
              action: ApprovalAction.RESUBMIT,
              from_status: ApprovalStatus.REJECTED,
              to_status: ApprovalStatus.PENDING,
              remark: "修改资料后重新提交",
              metadata: {
                round: newRound,
                title: dto.title,
                firstApproverDept: chain[0].dept_name,
              },
            },
            tx,
          );
          return { requestId, action: ApprovalAction.RESUBMIT };
        }),
    );

    if (!result) throw new AppError("系统繁忙，请稍后重试", 429001, 429);
    return result;
  }

  /**
   * 待办审批
   * ⭐ 只返回「用户是负责人」的部门节点
   */
  async getTasks(userId: string, tenantId: string) {
    const isSuper = await this.repository.isSuperAdmin(userId, tenantId);
    if (isSuper) {
      return prisma.sys_approval_node.findMany({
        where: {
          tenant_id: tenantId,
          status: NodeStatus.PENDING,
          is_current: 1,
          is_deleted: 0,
        },
        orderBy: { created_at: "desc" },
      });
    }
    const deptIds = await this.repository.findLeaderDeptIds(userId, tenantId);
    if (deptIds.length === 0) return [];
    return this.repository.findPendingTasks(tenantId, deptIds);
  }

  // ==================== 内部断言 ====================

  private async assertPending(
    requestId: string,
    tenantId: string,
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  ) {
    const request = await tx.sys_approval_request.findFirst({
      where: { request_id: requestId, tenant_id: tenantId, is_deleted: 0 },
    });
    if (!request) throw new NotFoundError("审批申请不存在");
    if (request.status !== ApprovalStatus.PENDING)
      throw new AppError("当前状态不可审批", 400002, 400);
    return request;
  }

  private async assertCurrentNode(
    requestId: string,
    tenantId: string,
    userId: string,
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  ) {
    const currentNode = await tx.sys_approval_node.findFirst({
      where: {
        request_id: requestId,
        is_current: 1,
        status: NodeStatus.PENDING,
        is_deleted: 0,
      },
    });
    if (!currentNode) throw new AppError("未找到当前审批节点", 400003, 400);

    const isLeader = await this.repository.isUserLeaderOfDept(
      userId,
      currentNode.dept_id,
      tenantId,
      tx,
    );
    const isSuper = await this.repository.isSuperAdmin(userId, tenantId, tx);

    if (!isLeader && !isSuper) {
      throw new AuthorizationError("您不是该部门负责人，无权审批");
    }
    return currentNode;
  }
}
