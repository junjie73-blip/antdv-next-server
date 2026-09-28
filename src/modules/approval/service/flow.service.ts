import { ApprovalRequestRepository } from "../repository/request.repository.js";
import {
  APPROVAL_STATUS_LABEL,
  type ApprovalFlowVO,
  type ApprovalNodeVO,
} from "../types.js";
import type { ApprovalFlowQueryDTO } from "../schema.js";
import { prisma } from "@/config/index.js";
import { BaseService } from "@/core/index.js";
import { keysToCamelCase } from "@/shared/utils/case-convert.js";
import { logger } from "@/platform/logger/index.js";

interface RawNode {
  node_id: string;
  dept_id: string;
  approver_id: string | null;
  sequence: number;
  status: string;
  is_current: number;
  reject_reason: string | null;
  approved_at: Date | null;
}

interface RawRequest {
  request_id: string;
  title: string;
  content: string | null;
  status: string;
  applicant_id: string;
  current_dept_id: string;
  created_at: Date;
  updated_at: Date;
  nodes: RawNode[];
}

export class ApprovalFlowService extends BaseService<ApprovalRequestRepository> {
  constructor(repository: ApprovalRequestRepository) {
    super(repository);
  }

  async getFlowPage(dto: ApprovalFlowQueryDTO, tenantId: string) {
    const { list, total } = await this.repository.findFlowPage(dto, tenantId);
    if (list.length === 0) return { list: [], total };

    const { deptMap, userMap, applicantDeptMap } = await this.loadRelations(
      list as unknown as RawRequest[],
      tenantId,
    );

    const items: ApprovalFlowVO[] = (list as unknown as RawRequest[]).map((r) =>
      this.toVO(r, deptMap, userMap, applicantDeptMap),
    );
    return { list: items, total };
  }

  async getFlowDetail(requestId: string, tenantId: string) {
    const request = await this.repository.findFlowDetail(requestId, tenantId);
    if (!request) return null;

    const { deptMap, userMap, applicantDeptMap } = await this.loadRelations(
      [request as unknown as RawRequest],
      tenantId,
    );
    return this.toVO(
      request as unknown as RawRequest,
      deptMap,
      userMap,
      applicantDeptMap,
    );
  }

  private async loadRelations(rows: RawRequest[], tenantId: string) {
    const deptIds = new Set<string>();
    const userIds = new Set<string>();
    const applicantIds = new Set<string>();

    for (const r of rows) {
      if (r.current_dept_id) deptIds.add(r.current_dept_id);
      if (r.applicant_id) {
        userIds.add(r.applicant_id);
        applicantIds.add(r.applicant_id);
      }
      for (const n of r.nodes ?? []) {
        if (!n.node_id) continue;
        if (n.dept_id) deptIds.add(n.dept_id);
        if (n.approver_id) userIds.add(n.approver_id);
      }
    }

    // ⭐ 查每个申请人的主部门
    const applicantDeptMap = await this.loadApplicantDeptMap(
      [...applicantIds],
      tenantId,
    );

    const [deptMap, userMap] = await Promise.all([
      this.repository.findDeptNames([...deptIds], tenantId),
      this.repository.findUserNames([...userIds], tenantId),
    ]);

    return { deptMap, userMap, applicantDeptMap };
  }
  private async loadApplicantDeptMap(userIds: string[], tenantId: string) {
    if (userIds.length === 0) {
      return new Map<string, { dept_id: string; dept_name: string }>();
    }

    const rows = await prisma.sys_user_dept.findMany({
      where: {
        user_id: { in: userIds },
        tenant_id: tenantId,
        is_primary: 1,
      },
      select: {
        user_id: true,
        dept_id: true,
        dept: { select: { dept_name: true } },
      },
    });

    return new Map(
      rows.map((r) => [
        r.user_id,
        {
          dept_id: r.dept_id,
          dept_name: r.dept?.dept_name ?? "",
        },
      ]),
    );
  }
  private toVO(
    r: RawRequest,
    deptMap: Map<string, string>,
    userMap: Map<string, string>,
    applicantDeptMap: Map<string, { dept_id: string; dept_name: string }>,
  ): ApprovalFlowVO {
    // 强校验：只有含 node_id 的对象才当节点
    const rawNodes = (r.nodes ?? []).filter((n) => n && n.node_id);

    // 临时调试：打印实际拿到的节点数量
    logger.debug(
      { requestId: r.request_id, nodeCount: rawNodes.length },
      "[ApprovalFlow] toVO",
    );
    const sorted = [...rawNodes].sort((a, b) => a.sequence - b.sequence);

    const nodes: ApprovalNodeVO[] = sorted
      .map((n) => ({
        node_id: n.node_id,
        dept_id: n.dept_id,
        dept_name: deptMap.get(n.dept_id) ?? null,
        approver_id: n.approver_id,
        approver_name: n.approver_id
          ? (userMap.get(n.approver_id) ?? null)
          : null,
        sequence: n.sequence,
        status: n.status,
        is_current: n.is_current,
        reject_reason: n.reject_reason,
        approved_at: n.approved_at,
        reject_reason_type: n.reject_reason_type ?? null,
      }))
      .map(keysToCamelCase) as ApprovalNodeVO[];
    const applicantDept = applicantDeptMap.get(r.applicant_id);
    const applicantNode: ApprovalNodeVO = {
      node_id: `applicant-${r.request_id}`,
      dept_id: applicantDept?.dept_id ?? "",
      dept_name: applicantDept?.dept_name ?? null,
      approver_id: r.applicant_id,
      approver_name: userMap.get(r.applicant_id) ?? null,
      sequence: -1, // 排最前
      round: 0,
      status: "1", // 视作已完成
      is_current: 0,
      reject_reason: null,
      approved_at: null,
      is_applicant: true,
      applicant_name: userMap.get(r.applicant_id) ?? null,
      submitted_at: r.created_at,
    };

    return keysToCamelCase({
      request_id: r.request_id,
      title: r.title,
      content: r.content,
      status: r.status,
      status_label: APPROVAL_STATUS_LABEL[r.status] ?? r.status,
      applicant_id: r.applicant_id,
      applicant_name: userMap.get(r.applicant_id) ?? null,
      current_dept_id: r.current_dept_id,
      current_dept_name: deptMap.get(r.current_dept_id) ?? null,
      created_at: r.created_at,
      updated_at: r.updated_at,
      nodes: [applicantNode, ...nodes],
    });
  }
}
