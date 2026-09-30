import { z } from "zod";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** ✅ 单日范围上限：一年 */
const MAX_RANGE_DAYS = 366;

function isDateStr(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime());
}

/**
 * 日期范围共用校验：
 *  - 格式 YYYY-MM-DD
 *  - endDate >= startDate
 *  - 跨度 ≤ MAX_RANGE_DAYS
 */
const DateRangeBase = z.object({
  startDate: z
    .string()
    .regex(DATE_RE, "startDate 格式必须为 YYYY-MM-DD")
    .refine(isDateStr, "startDate 非法日期"),
  endDate: z
    .string()
    .regex(DATE_RE, "endDate 格式必须为 YYYY-MM-DD")
    .refine(isDateStr, "endDate 非法日期"),
});

function withRangeValidation<T extends typeof DateRangeBase>(schema: T) {
  return schema
    .refine(
      (data) => {
        const start = new Date(`${data.startDate}T00:00:00Z`).getTime();
        const end = new Date(`${data.endDate}T00:00:00Z`).getTime();
        return end >= start;
      },
      { message: "endDate 不能早于 startDate", path: ["endDate"] },
    )
    .refine(
      (data) => {
        const start = new Date(`${data.startDate}T00:00:00Z`).getTime();
        const end = new Date(`${data.endDate}T00:00:00Z`).getTime();
        const days = (end - start) / 86400000 + 1;
        return days <= MAX_RANGE_DAYS;
      },
      {
        message: `查询跨度不能超过 ${MAX_RANGE_DAYS} 天`,
        path: ["endDate"],
      },
    );
}

/** 查询：日期范围 + operation */
export const DailyQuerySchema = withRangeValidation(DateRangeBase).and(
  z.object({ operation: z.string().max(128).optional() }),
) as unknown as z.ZodType<{
  startDate: string;
  endDate: string;
  operation?: string;
}>;

/** Top 操作：日期范围 + operation + limit */
export const TopOperationsQuerySchema = withRangeValidation(DateRangeBase)
  .and(
    z.object({
      operation: z.string().max(128).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    }),
  )
  .transform((v) => ({
    startDate: (v as any).startDate as string,
    endDate: (v as any).endDate as string,
    operation: (v as any).operation as string | undefined,
    limit: (v as any).limit as number,
  }));

/** 聚合触发：指定日期（默认昨天） */
export const AggregateSchema = z.object({
  date: z
    .string()
    .regex(DATE_RE, "日期格式必须为 YYYY-MM-DD")
    .refine(isDateStr, "日期非法")
    .optional(),
});

export type AggregateDTO = z.infer<typeof AggregateSchema>;
export type DailyQueryDTO = z.infer<typeof DailyQuerySchema>;
export type TopOperationsQueryDTO = z.infer<typeof TopOperationsQuerySchema>;
