import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { ALLOWED_TABLES } from "./constants.js";

extendZodWithOpenApi(z);

const TABLE_NAME_ENUM = [...ALLOWED_TABLES] as [string, ...string[]];

/* ============================================================
 * 更新策略
 * ============================================================ */
export const ArchivePolicyUpdateSchema = z
  .object({
    displayName: z.string().min(1).max(128).optional(),
    retentionMonths: z.number().int().min(1).max(120).optional(),
    archiveEnabled: z.number().int().min(0).max(1).optional(),
    storageEnabled: z.number().int().min(0).max(1).optional(),
    batchSize: z.number().int().min(100).max(100_000).optional(),
    cronExpression: z
      .string()
      .max(64)
      .regex(/^[\d*\/,\- ]+$/, "cron 表达式格式错误")
      .optional(),
    enabled: z.number().int().min(0).max(1).optional(),
    remark: z.string().max(512).nullable().optional(),
  })
  .openapi("ArchivePolicyUpdate");

/* ============================================================
 * 手动触发
 * ============================================================ */
export const ArchiveTriggerSchema = z
  .object({
    tableName: z.enum(TABLE_NAME_ENUM),
    /** 是否 dry-run（只统计不删除） */
    dryRun: z.boolean().default(false),
  })
  .openapi("ArchiveTrigger");

/* ============================================================
 * 执行日志查询
 * ============================================================ */
export const ArchiveLogListSchema = z
  .object({
    pageNum: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    tableName: z.enum(TABLE_NAME_ENUM).optional(),
    status: z.enum(["success", "failed", "skipped"]).optional(),
    startTime: z.coerce.date().optional(),
    endTime: z.coerce.date().optional(),
  })
  .openapi("ArchiveLogList");

export type ArchivePolicyUpdateDTO = z.infer<typeof ArchivePolicyUpdateSchema>;
export type ArchiveTriggerDTO = z.infer<typeof ArchiveTriggerSchema>;
export type ArchiveLogListDTO = z.infer<typeof ArchiveLogListSchema>;
