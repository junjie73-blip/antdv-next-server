import { z } from "zod";

/** 聚合触发：指定日期 */
export const AggregateSchema = z.object({
  /** 格式 YYYY-MM-DD，默认昨天 */
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必须为 YYYY-MM-DD")
    .optional(),
});

/** 查询：日期范围 */
export const DailyQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  operation: z.string().max(128).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type AggregateDTO = z.infer<typeof AggregateSchema>;
export type DailyQueryDTO = z.infer<typeof DailyQuerySchema>;
