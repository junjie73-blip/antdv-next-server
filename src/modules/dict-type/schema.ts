import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

export const DictTypeCreateSchema = z
  .object({
    dictCode: z.string().min(2).max(64).openapi({ description: "字典编码" }),
    dictName: z.string().min(2).max(128).openapi({ description: "字典名称" }),
    description: z.string().max(512).optional(),
    status: z
      .number()
      .int()
      .min(0)
      .max(1)
      .default(1)
      .openapi({ description: "状态：0-禁用，1-启用" }),
  })
  .openapi("DictTypeCreate");

export const DictTypeUpdateSchema =
  DictTypeCreateSchema.partial().openapi("DictTypeUpdate");

export const DictTypeListSchema = z
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
    keyword: z.string().optional().openapi({ description: "编码或名称" }),
    status: z.string().optional().openapi({ description: "状态过滤" }),
  })
  .openapi("DictTypeList");
