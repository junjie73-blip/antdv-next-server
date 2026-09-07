import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

export const DictDataCreateSchema = z
  .object({
    dictTypeId: z.string().uuid().openapi({ description: "字典类型ID" }),
    dictLabel: z.string().min(1).max(128).openapi({ description: "字典标签" }),
    dictValue: z.string().min(1).max(128).openapi({ description: "字典值" }),
    sortOrder: z.number().int().default(0).openapi({ description: "排序" }),
    status: z
      .number()
      .int()
      .min(0)
      .max(1)
      .default(1)
      .openapi({ description: "状态" }),
    remark: z.string().max(512).optional().openapi({ description: "备注" }),
  })
  .openapi("DictDataCreate");

export const DictDataUpdateSchema =
  DictDataCreateSchema.partial().openapi("DictDataUpdate");

export const DictDataListSchema = z
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
    dictTypeId: z
      .string()
      .uuid()
      .optional()
      .openapi({ description: "按字典类型ID过滤" }),
    keyword: z.string().optional().openapi({ description: "标签或值" }),
    status: z.string().optional().openapi({ description: "状态过滤" }),
  })
  .openapi("DictDataList");
