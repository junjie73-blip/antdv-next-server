import { z } from "zod";

export const JobImportRowSchema = z
  .object({
    任务名称: z.string().min(1).max(128),
    分组: z.string().max(64).default("DEFAULT"),
    执行目标: z.string().min(1).max(256),
    Cron表达式: z.string().min(1).max(64),
    状态: z.enum(["启用", "停用"]).default("启用"),
    备注: z.string().max(512).optional().default(""),
  })
  .openapi("JobImportRowSchema");

export const JobExportColumns = [
  { header: "任务名称", key: "job_name", width: 24 },
  { header: "分组", key: "job_group", width: 16 },
  { header: "执行目标", key: "invoke_target", width: 30 },
  { header: "Cron表达式", key: "cron_expression", width: 20 },
  {
    header: "状态",
    key: "status",
    width: 10,
    formatter: (v: string) => (v === "1" ? "启用" : "停用"),
  },
  { header: "备注", key: "remark", width: 30 },
] as const;
export const JobCreateSchema = z.object({
  jobName: z.string().min(1).max(128),
  jobGroup: z.string().max(64).default("DEFAULT"),
  invokeTarget: z.string().min(1).max(256),
  cronExpression: z.string().min(1).max(64),
  misfirePolicy: z.number().int().min(1).max(3).default(3),
  concurrent: z.number().int().min(0).max(1).default(1),
  status: z
    .string()
    .regex(/^[01]$/)
    .default("1"),
  remark: z.string().max(512).optional(),
  // ⭐ 告警字段
  alertEnabled: z.number().int().min(0).max(1).default(0),
  alertChannels: z.array(z.enum(["email", "sms", "webhook"])).default([]),
  alertReceivers: z.array(z.string().min(1).max(256)).default([]),
  alertThreshold: z.number().int().min(1).max(20).default(3),
});

export const JobUpdateSchema = JobCreateSchema.partial();

/* ============================================================
 * 日志查询
 * ============================================================ */
export const JobLogListSchema = z.object({
  jobName: z.string().optional(),
  status: z
    .string()
    .regex(/^[01]$/)
    .optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});
export const JobDependencySchema = z.object({
  dependencyJobIds: z
    .array(z.string().uuid())
    .max(50)
    .default([])
    .openapi({ description: "依赖的前置任务 ID 数组" }),
  dependencyMode: z
    .enum(["all", "any"])
    .default("all")
    .openapi({ description: "依赖满足模式：all-全部成功 any-任一成功" }),
  onDependencyFail: z
    .enum(["skip", "abort"])
    .default("skip")
    .openapi({ description: "依赖失败时的行为：skip-跳过 abort-中止" }),
});
export type JobCreateDTO = z.infer<typeof JobCreateSchema>;
export type JobUpdateDTO = z.infer<typeof JobUpdateSchema>;
export type JobLogListDTO = z.infer<typeof JobLogListSchema>;
