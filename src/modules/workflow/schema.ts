import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

/* ============================================================
 * 流程实例
 * ============================================================ */
export const WfStartSchema = z
  .object({
    defKey: z.string().min(2).max(64),
    title: z.string().min(1).max(256),
    businessKey: z.string().max(128).optional(),
    variables: z.record(z.string(), z.any()).default({}),
  })
  .openapi("WfStart");

export const WfInstanceListSchema = z
  .object({
    defKey: z.string().optional(),
    status: z.enum(["0", "1", "2", "3"]).optional(),
    keyword: z.string().optional(),
    initiatorId: z.string().uuid().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    pageNum: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
  })
  .openapi("WfInstanceList");

export const WfTerminateSchema = z
  .object({
    reason: z.string().min(1).max(500),
  })
  .openapi("WfTerminate");

/* ============================================================
 * 任务
 * ============================================================ */
export const WfCompleteTaskSchema = z
  .object({
    action: z.enum(["approve", "reject"]),
    comment: z.string().max(1000).optional(),
    formData: z.record(z.string(), z.any()).optional(),
    variables: z.record(z.string(), z.any()).optional(),
  })
  .openapi("WfCompleteTask");

export const WfTaskListSchema = z
  .object({
    keyword: z.string().optional(),
    defKey: z.string().max(64).optional(),
    priority: z.coerce.number().int().min(0).max(2).optional(),
    pageNum: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
  })
  .openapi("WfTaskList");

export const WfBatchCompleteSchema = z
  .object({
    taskIds: z.array(z.string().uuid()).min(1).max(50),
    action: z.enum(["approve", "reject"]),
    comment: z.string().max(1000).optional(),
  })
  .openapi("WfBatchComplete");

const AssigneeConfigSchema = z.object({
  type: z.enum([
    "user",
    "role",
    "dept",
    "deptLeader",
    "initiator",
    "expression",
  ]),
  value: z.string().max(512).optional(),
  level: z.number().int().min(1).max(10).optional(),
  expression: z.string().max(500).optional(),
});

const CountersignConfigSchema = z.object({
  signType: z.enum(["all", "any", "sequential"]),
  passPercent: z.number().int().min(1).max(100).optional(),
  assignees: z.array(AssigneeConfigSchema).min(1).max(50),
});

const TimeoutConfigSchema = z.object({
  duration: z.string().regex(/^\d+[smhd]$/, "格式如 30m / 2h / 1d"),
  action: z.enum(["notify", "autoApprove", "autoReject"]),
  escalateTo: z.object({
    type: z.enum(["deptLeader", "initiatorLeader", "user", "role"]),
    value: z.string().max(512).optional(),
  }),
  maxEscalateLevel: z.number().int().min(1).max(10).optional(),
});

const FormFieldSchema = z.object({
  field: z.string().min(1).max(64),
  label: z.string().min(1).max(128),
  type: z.enum([
    "input",
    "textarea",
    "number",
    "select",
    "date",
    "user",
    "switch",
  ]),
  required: z.boolean().optional(),
  placeholder: z.string().max(200).optional(),
  defaultValue: z.any().optional(),
  options: z.array(z.object({ label: z.string(), value: z.any() })).optional(),
  /** 校验规则 */
  rules: z
    .array(
      z.object({
        type: z.string(),
        message: z.string().optional(),
        value: z.any().optional(),
      }),
    )
    .optional(),
});

const NodeTypeSchema = z.enum([
  "start",
  "end",
  "userTask",
  "countersignTask",
  "orSignTask",
  "serviceTask",
  "scriptTask",
  "exclusiveGateway",
  "parallelGateway",
  "inclusiveGateway",
  "ccTask",
]);
const CcConfigSchema = z
  .object({
    assignees: z
      .array(AssigneeConfigSchema)
      .min(1, "至少配置一个抄送对象")
      .max(50, "抄送对象最多 50 个"),
    titleTemplate: z.string().max(256).optional(),
    contentTemplate: z.string().max(2000).optional(),
    realtime: z.boolean().default(true),
    pushMessage: z.boolean().default(true),
  })
  .openapi("WfCcConfig");

const WfNodeSchema = z.object({
  id: z.string().min(1).max(64),
  type: NodeTypeSchema,
  name: z.string().max(128).optional(),
  assignee: AssigneeConfigSchema.optional(),
  countersign: CountersignConfigSchema.optional(),
  timeout: TimeoutConfigSchema.optional(),
  priority: z.number().int().min(0).max(2).optional(),
  formSchema: z.array(FormFieldSchema).optional(),
  serviceConfig: z.record(z.string(), z.any()).optional(),
  ccConfig: CcConfigSchema.optional().optional(),
});

const WfEdgeSchema = z.object({
  id: z.string().min(1).max(64),
  source: z.string().min(1).max(64),
  target: z.string().min(1).max(64),
  condition: z.string().max(2000).optional(),
  isDefault: z.boolean().optional(),
});

export const WorkflowDefinitionJSONSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(128),
  variables: z
    .array(
      z.object({
        name: z.string().min(1).max(64),
        type: z.enum([
          "string",
          "number",
          "boolean",
          "date",
          "array",
          "object",
        ]),
        defaultValue: z.any().optional(),
        required: z.boolean().optional(),
      }),
    )
    .optional(),
  nodes: z.array(WfNodeSchema).min(1).max(200),
  edges: z.array(WfEdgeSchema).max(500).optional(),
});

/* ============================================================
 * CRUD
 * ============================================================ */

export const WfDefinitionCreateSchema = z
  .object({
    defKey: z
      .string()
      .min(2)
      .max(64)
      .regex(
        /^[a-zA-Z][a-zA-Z0-9_-]*$/,
        "只允许字母开头，含字母数字下划线中划线",
      ),
    defName: z.string().min(2).max(128),
    category: z.string().max(64).optional(),
    description: z.string().max(512).optional(),
    /** BPMN JSON（业务） */
    definition: WorkflowDefinitionJSONSchema,
    /** BPMN XML 原文（编辑器还原用） */
    definitionXml: z.string().max(500_000).optional(),
    formSchema: z.array(FormFieldSchema).optional(),
    varSchema: z
      .array(
        z.object({
          name: z.string(),
          type: z.string(),
          defaultValue: z.any().optional(),
        }),
      )
      .optional(),
    status: z.enum(["0", "1", "2"]).default("0"),
  })
  .openapi("WfDefinitionCreate");

export const WfDefinitionUpdateSchema = z
  .object({
    defName: z.string().min(2).max(128).optional(),
    category: z.string().max(64).optional(),
    description: z.string().max(512).optional(),
    definition: WorkflowDefinitionJSONSchema.optional(),
    definitionXml: z.string().max(500_000).optional(),
    formSchema: z.array(FormFieldSchema).optional(),
    varSchema: z
      .array(
        z.object({
          name: z.string(),
          type: z.string(),
          defaultValue: z.any().optional(),
        }),
      )
      .optional(),
  })
  .openapi("WfDefinitionUpdate");

export const WfDefinitionListSchema = z
  .object({
    keyword: z.string().max(128).optional(),
    category: z.string().max(64).optional(),
    status: z.enum(["0", "1", "2"]).optional(),
    pageNum: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
  })
  .openapi("WfDefinitionList");

/* ============================================================
 * 编辑器专用
 * ============================================================ */

/** 校验 BPMN（不落库） */
export const WfValidateBpmnSchema = z
  .object({
    definition: WorkflowDefinitionJSONSchema,
  })
  .openapi("WfValidateBpmn");

/** 导入 BPMN XML → JSON */
export const WfImportXmlSchema = z
  .object({
    xml: z.string().min(1).max(500_000),
  })
  .openapi("WfImportXml");
/* ============================================================
 * 流程实例
 * ============================================================ */

export const WfStartInstanceSchema = z
  .object({
    defKey: z.string().min(2).max(64),
    title: z.string().min(1).max(256),
    businessKey: z.string().max(128).optional(),
    variables: z.record(z.string(), z.any()).default({}),
  })
  .openapi("WfStartInstance");
export const AddSignSchema = z
  .object({
    /** 加签目标用户 */
    userIds: z.array(z.string().uuid()).min(1).max(20),
    /** before-前加签 after-后加签 */
    signType: z.enum(["before", "after"]).default("after"),
    /** 加签意见 */
    comment: z.string().max(1000).optional(),
  })
  .openapi("WfAddSign");
export const TransferTaskSchema = z
  .object({
    targetUserId: z.string().uuid(),
    comment: z.string().max(1000).optional(),
  })
  .openapi("WfTransferTask");
export const WfDelegateCreateSchema = z
  .object({
    delegateeId: z.string().uuid().openapi({ description: "被委托人" }),
    /** 限定流程 key，不传 = 全部流程 */
    defKeys: z.array(z.string().max(64)).max(50).optional(),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    reason: z.string().max(512).optional(),
  })
  .refine((d) => d.endAt > d.startAt, {
    message: "结束时间必须晚于开始时间",
    path: ["endAt"],
  })
  .refine(
    (d) => {
      const days = (d.endAt.getTime() - d.startAt.getTime()) / 86400000;
      return days <= 365;
    },
    { message: "委托时长不能超过 365 天", path: ["endAt"] },
  )
  .openapi("WfDelegateCreate");
export const WfDelegateUpdateSchema = z
  .object({
    defKeys: z.array(z.string().max(64)).max(50).nullable().optional(),
    startAt: z.coerce.date().optional(),
    endAt: z.coerce.date().optional(),
    reason: z.string().max(512).nullable().optional(),
    enabled: z.number().int().min(0).max(1).optional(),
  })
  .openapi("WfDelegateUpdate");

export const WfDelegateListSchema = z
  .object({
    pageNum: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    delegatorId: z.string().uuid().optional(),
    delegateeId: z.string().uuid().optional(),
    enabled: z.coerce.number().int().min(0).max(1).optional(),
  })
  .openapi("WfDelegateList");
/* ============================================================
 * 类型导出
 * ============================================================ */
export type AddSignDTO = z.infer<typeof AddSignSchema>;
export type TransferTaskDTO = z.infer<typeof TransferTaskSchema>;
export type WfDelegateCreateDTO = z.infer<typeof WfDelegateCreateSchema>;
export type WfDelegateUpdateDTO = z.infer<typeof WfDelegateUpdateSchema>;
export type WfDelegateListDTO = z.infer<typeof WfDelegateListSchema>;
export type WfStartInstanceDTO = z.infer<typeof WfStartInstanceSchema>;
export type WfDefinitionCreateDTO = z.infer<typeof WfDefinitionCreateSchema>;
export type WfDefinitionUpdateDTO = z.infer<typeof WfDefinitionUpdateSchema>;
export type WfDefinitionListDTO = z.infer<typeof WfDefinitionListSchema>;
export type WorkflowDefinitionJSON = z.infer<
  typeof WorkflowDefinitionJSONSchema
>;
export type WfNodeDTO = z.infer<typeof WfNodeSchema>;
export type WfEdgeDTO = z.infer<typeof WfEdgeSchema>;
export type FormFieldDTO = z.infer<typeof FormFieldSchema>;
export type WfStartDTO = z.infer<typeof WfStartSchema>;
export type WfInstanceListDTO = z.infer<typeof WfInstanceListSchema>;
export type WfCompleteTaskDTO = z.infer<typeof WfCompleteTaskSchema>;
export type WfTaskListDTO = z.infer<typeof WfTaskListSchema>;
