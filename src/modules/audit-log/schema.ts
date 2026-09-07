import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

export const AuditLogListSchema = z
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
    username: z.string().optional().openapi({ description: "操作人用户名" }),
    operation: z
      .string()
      .optional()
      .openapi({ description: "操作描述（模糊）" }),
    method: z.string().optional().openapi({ description: "HTTP方法" }),
    status: z
      .string()
      .optional()
      .openapi({ description: "状态：0-失败，1-成功" }),
    startTime: z
      .string()
      .datetime()
      .optional()
      .openapi({ description: "开始时间（ISO格式）" }),
    endTime: z
      .string()
      .datetime()
      .optional()
      .openapi({ description: "结束时间（ISO格式）" }),
  })
  .openapi("AuditLogList");

export const AuditLogExportSchema = AuditLogListSchema.omit({
  pageNum: true,
  pageSize: true,
}).openapi("AuditLogExport");
