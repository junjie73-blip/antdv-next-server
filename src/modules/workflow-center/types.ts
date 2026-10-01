export type TodoSource = "approval" | "workflow";

export interface TodoItemDTO {
  source: TodoSource;
  id: string;
  instanceId: string;
  title: string;
  nodeName: string;
  defKey: string;
  initiatorId: string;
  initiatorName?: string;
  createdAt: string;
  dueAt?: string | null;
  priority?: number;
  status: string;
}

export interface FlowDetailDTO {
  source: TodoSource;
  id: string;
  title: string;
  status: string;
  defKey: string;
  initiatorId: string;
  initiatorName?: string;
  createdAt: string;
  updatedAt: string;
  nodes?: unknown[];
  definition?: unknown;
  definitionXml?: string | null;
  nodeStatus?: Record<string, string>;
  formData?: Record<string, unknown>;
  logs: FlowLogDTO[];
}

export interface FlowLogDTO {
  id: string;
  action: string;
  actionLabel?: string;
  nodeName?: string;
  operatorId?: string;
  operatorName?: string;
  remark?: string | null;
  createdAt: string;
}
