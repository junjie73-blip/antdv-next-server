import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

export const LoginLogListSchema = z
  .object({
    pageNum: z
      .number()
      .int()
      .positive()
      .default(1)
      .openapi({ description: "页码" }),
    pageSize: z
      .number()
      .int()
      .positive()
      .max(100)
      .default(10)
      .openapi({ description: "每页条数" }),
    username: z.string().optional().openapi({ description: "用户名" }),
    status: z
      .string()
      .optional()
      .openapi({ description: "状态：0-失败，1-成功" }),
    startTime: z
      .string()
      .datetime()
      .optional()
      .openapi({ description: "开始时间" }),
    endTime: z
      .string()
      .datetime()
      .optional()
      .openapi({ description: "结束时间" }),
    fields: z
      .string()
      .optional()
      .openapi({ description: "查询字段，逗号分隔" }),
  })
  .openapi("LoginLogList");

export const LoginLogExportSchema = LoginLogListSchema.omit({
  pageNum: true,
  pageSize: true,
}).openapi("LoginLogExport");
