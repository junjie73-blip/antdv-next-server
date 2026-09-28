import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

export const FileListSchema = z
  .object({
    pageNum: z.number().int().positive().default(1),
    pageSize: z.number().int().positive().max(100).default(10),
    keyword: z.string().optional().openapi({ description: "文件名关键字" }),
    category: z.string().optional().openapi({ description: "文件分类" }),
    fields: z
      .string()
      .optional()
      .openapi({ description: "查询字段，逗号分隔" }),
  })
  .openapi("FileList");
