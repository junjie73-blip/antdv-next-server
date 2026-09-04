import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);
export const registry = new OpenAPIRegistry();

export const ErrorResponseSchema = z
  .object({
    code: z.number().openapi({ description: "错误码", example: 400001 }),
    message: z
      .string()
      .openapi({ description: "错误信息", example: "参数校验失败" }),
    timestamp: z.string().openapi({ description: "时间戳" }),
  })
  .openapi("ErrorResponse");

export const PaginationSchema = z
  .object({
    list: z.array(z.any()).openapi({ description: "数据列表" }),
    total: z.number().openapi({ description: "总记录数" }),
    page: z.number().openapi({ description: "当前页" }),
    pageSize: z.number().openapi({ description: "每页条数" }),
    totalPages: z.number().openapi({ description: "总页数" }),
  })
  .openapi("PaginationResponse");
