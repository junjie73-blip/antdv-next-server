import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

export const ConfigCreateSchema = z
  .object({
    configKey: z.string().min(1).max(128).openapi({ description: "配置键" }),
    configValue: z.string().optional().openapi({ description: "配置值" }),
    description: z
      .string()
      .max(512)
      .optional()
      .openapi({ description: "描述" }),
  })
  .openapi("ConfigCreate");

export const ConfigUpdateSchema =
  ConfigCreateSchema.partial().openapi("ConfigUpdate");

export const ConfigListSchema = z
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
    keyword: z.string().optional().openapi({ description: "配置键或描述" }),
  })
  .openapi("ConfigList");
