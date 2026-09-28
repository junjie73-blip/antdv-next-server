export enum ApprovalStatus {
  DRAFT = "0",
  PENDING = "1",
  APPROVED = "2",
  REJECTED = "3",
}

export enum NodeStatus {
  PENDING = "0",
  APPROVED = "1",
  REJECTED = "2",
  INVALID = "3",
}

export enum ApprovalAction {
  SUBMIT = "SUBMIT",
  APPROVE = "APPROVE",
  REJECT = "REJECT",
  RESUBMIT = "RESUBMIT",
}

export const APPROVAL_STATUS_LABEL: Record<string, string> = {
  [ApprovalStatus.DRAFT]: "草稿",
  [ApprovalStatus.PENDING]: "审批中",
  [ApprovalStatus.APPROVED]: "已通过",
  [ApprovalStatus.REJECTED]: "已驳回",
};

export const APPROVAL_ACTION_LABEL: Record<string, string> = {
  [ApprovalAction.SUBMIT]: "提交",
  [ApprovalAction.APPROVE]: "通过",
  [ApprovalAction.REJECT]: "驳回",
  [ApprovalAction.RESUBMIT]: "重新提交",
};

export interface ApprovalNodeVO {
  node_id: string;
  dept_id: string;
  dept_name: string | null;
  approver_id: string | null;
  approver_name: string | null;
  sequence: number;
  status: string;
  is_current: number;
  reject_reason: string | null;
  approved_at: Date | null;
  is_applicant?: boolean;
  round: number;
  applicant_name: string | null;
  submitted_at: Date | null;
  reject_reason_type: string | null;
}

export interface ApprovalFlowVO {
  request_id: string;
  title: string;
  content: string | null;
  status: string;
  status_label: string;
  applicant_id: string;
  applicant_name: string | null;
  current_dept_id: string;
  current_dept_name: string | null;
  created_at: Date;
  updated_at: Date;
  nodes: ApprovalNodeVO[];
}

export interface ApprovalLogVO {
  log_id: string;
  request_id: string;
  request_title: string | null;
  operator_id: string;
  operator_name: string | null;
  action: string;
  action_label: string;
  from_status: string | null;
  to_status: string | null;
  remark: string | null;
  reason_type: string | null;
  created_at: Date;
}
