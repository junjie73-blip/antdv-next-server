import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import {
  LOKI_ALLOWED_LABELS,
  LOKI_DEFAULT_LIMIT,
  LOKI_MAX_LIMIT,
  LOKI_MAX_RANGE_HOURS,
} from "@/platform/logging/constants.js";

extendZodWithOpenApi(z);

const LabelEnum = z.enum(LOKI_ALLOWED_LABELS);

export const LogQuerySchema = z
  .object({
    /** 起始时间（毫秒） */
    start: z.coerce.number().int().positive(),
    /** 结束时间（毫秒） */
    end: z.coerce.number().int().positive(),
    /** LogQL 查询串，如 `{app="antdv"} |= "error"` */
    query: z.string().min(1).max(1024),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(LOKI_MAX_LIMIT)
      .default(LOKI_DEFAULT_LIMIT),
    direction: z.enum(["forward", "backward"]).default("backward"),
  })
  .refine((d) => (d.end - d.start) / 3600_000 <= LOKI_MAX_RANGE_HOURS, {
    message: `查询时间跨度不得超过 ${LOKI_MAX_RANGE_HOURS} 小时`,
  })
  .openapi("LogQuery");

/** 快速检索（前端简化入口） */
export const QuickSearchSchema = z
  .object({
    /** 关键词（模糊匹配） */
    keyword: z.string().max(256).optional(),
    /** 日志级别 */
    level: z
      .enum(["trace", "debug", "info", "warn", "error", "fatal"])
      .optional(),
    /** 模块 */
    module: z.string().max(64).optional(),
    /** 租户 */
    tenantId: z.string().uuid().optional(),
    /** 最近 N 分钟 */
    sinceMinutes: z.coerce.number().int().min(1).max(1440).default(30),
    limit: z.coerce.number().int().min(1).max(LOKI_MAX_LIMIT).default(200),
  })
  .openapi("LogQuickSearch");

export type LogQueryDTO = z.infer<typeof LogQuerySchema>;
export type QuickSearchDTO = z.infer<typeof QuickSearchSchema>;
