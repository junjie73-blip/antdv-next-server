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
