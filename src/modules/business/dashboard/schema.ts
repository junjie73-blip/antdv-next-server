import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

// 时间范围查询参数
export const DashboardRangeSchema = z
  .object({
    range: z
      .enum(["today", "7d", "30d"])
      .default("today")
      .openapi({ description: "时间范围" }),
  })
  .openapi("DashboardRange");

// 系统活动趋势
export const ActivityTrendSchema = z
  .object({
    range: z.enum(["today", "7d", "30d"]).default("30d"),
  })
  .openapi("ActivityTrend");

export type DashboardRangeDto = z.infer<typeof DashboardRangeSchema>;
