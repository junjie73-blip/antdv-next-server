import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

export const BackupListSchema = z
  .object({
    status: z.enum(["pending", "running", "completed", "failed"]).optional(),
    triggerType: z.enum(["manual", "cron", "pre_migrate"]).optional(),
    pageNum: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .openapi("BackupList");

export const BackupTriggerSchema = z
  .object({
    backupType: z.enum(["full", "schema_only", "data_only"]).default("full"),
    remark: z.string().max(512).optional(),
    retainDays: z.coerce.number().int().min(1).max(365).optional(),
  })
  .openapi("BackupTrigger");

export const BackupPolicySchema = z
  .object({
    policyId: z.string().uuid().optional(),
    name: z.string().min(1).max(128),
    cron: z.string().min(1).max(64),
    backupType: z.enum(["full", "schema_only", "data_only"]).default("full"),
    retainDays: z.coerce.number().int().min(1).max(365).default(30),
    retainCount: z.coerce.number().int().min(1).max(100).default(10),
    enabled: z.coerce.number().int().min(0).max(1).default(1),
    bucket: z.string().max(128).optional(),
    remark: z.string().max(512).nullable().optional(),
  })
  .openapi("BackupPolicy");

export type BackupListDTO = z.infer<typeof BackupListSchema>;
export type BackupTriggerDTO = z.infer<typeof BackupTriggerSchema>;
export type BackupPolicyDTO = z.infer<typeof BackupPolicySchema>;
