/** 节点类型 */
export type NodeType =
  | "start"
  | "end"
  | "userTask"
  | "countersignTask"
  | "orSignTask"
  | "serviceTask"
  | "scriptTask"
  | "exclusiveGateway"
  | "parallelGateway"
  | "inclusiveGateway";

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
  action: "notify" | "autoApprove" | "autoReject";
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
