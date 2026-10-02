/** 节点类型 */
export type NodeType =
  | "start"
  | "end"
  | "userTask"
  | "countersignTask"
  | "orSignTask"
  | "ccTask"
  | "serviceTask"
  | "scriptTask"
  | "exclusiveGateway"
  | "parallelGateway"
  | "inclusiveGateway";
export interface CcConfig {
  /** 接收人（复用审批人配置结构） */
  assignees: AssigneeConfig[];
  /** 抄送标题模板（支持 {{变量}}） */
  titleTemplate?: string;
  /** 抄送内容模板 */
  contentTemplate?: string;
  /** 是否发送实时通知（默认 true） */
  realtime?: boolean;
  /** 是否也写入消息中心（默认 true） */
  pushMessage?: boolean;
}
/** 审批人配置 */
export interface AssigneeConfig {
  type: "user" | "role" | "dept" | "deptLeader" | "initiator" | "expression";
  value?: string;
  level?: number;
  expression?: string;
}

/** 会签配置 */
export interface CountersignConfig {
  signType: "all" | "any" | "sequential";
  passPercent?: number;
  assignees: AssigneeConfig[];
}

/** 超时配置 */
export interface TimeoutConfig {
  duration: string;
  action: "notify" | "autoApprove" | "autoReject" | "escalate";
  escalateTo?: {
    type: "deptLeader" | "initiatorLeader" | "user" | "role";
    value?: string;
    level?: number;
  };
  maxEscalateLevel?: number;
}

/** BPMN 节点 */
export interface WfNode {
  id: string;
  type: NodeType;
  name?: string;
  assignee?: AssigneeConfig;
  countersign?: CountersignConfig;
  timeout?: TimeoutConfig;
  priority?: number;
  formSchema?: any[];
  serviceConfig?: Record<string, any>;
  ccConfig?: CcConfig;
}

/** BPMN 边 */
export interface WfEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
  isDefault?: boolean;
}

/** 完整定义 */
export interface WfDefinitionJSON {
  id: string;
  name: string;
  variables?: Array<{
    name: string;
    type: string;
    defaultValue?: any;
    required?: boolean;
  }>;
  nodes: WfNode[];
  edges?: WfEdge[];
}
export type WfEventType =
  | "assign"
  | "complete"
  | "reject"
  | "timeout"
  | "terminate"
  | "cc"
  | "start";

export interface WfNotifyParams {
  tenantId: string;
  instanceId: string;
  taskId?: string;
  nodeId?: string;
  eventType: WfEventType;
  receiverIds: string[];
  extra?: Record<string, any>;
}
/** wf_task 加签/转办字段 */
export interface WfTaskExtended {
  original_assignee_id: string | null;
  is_add_sign: number;
  add_sign_type: "before" | "after" | null;
  add_sign_parent_id: string | null;
  transferred_from_id: string | null;
  transferred_at: Date | null;
  escalation_level: number;
  escalated_at: Date | null;
  escalated_to: string | null;
}
/** 委托规则实体 */
export interface WfDelegateEntity {
  delegate_id: string;
  tenant_id: string;
  delegator_id: string;
  delegatee_id: string;
  def_keys: string[] | null;
  scope: string;
  start_at: Date;
  end_at: Date;
  reason: string | null;
  enabled: number;
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  updated_by: string | null;
  is_deleted: number;
}

/** 任务流转日志 */
export interface WfTaskTransferLogEntity {
  log_id: string;
  tenant_id: string;
  task_id: string;
  instance_id: string;
  action_type: "transfer" | "add_sign_before" | "add_sign_after" | "escalate";
  from_user_id: string | null;
  to_user_id: string | null;
  operator_id: string;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
}
export type TaskTransferActionType =
  | "transfer"
  | "add_sign_before"
  | "add_sign_after"
  | "escalate"
  | "rollback"
  | "delegate";
