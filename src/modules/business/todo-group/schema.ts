import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const TodoGroupCreateSchema = z
  .object({
    name: z.string().min(1).max(64).openapi({ description: "分组名称" }),
    color: z
      .string()
      .max(16)
      .optional()
      .openapi({ description: "分组颜色（十六进制）", example: "#1677ff" }),
    sortOrder: z
      .number()
      .int()
      .min(0)
      .default(0)
      .openapi({ description: "排序值" }),
  })
  .openapi("TodoGroupCreate");

export const TodoGroupUpdateSchema =
  TodoGroupCreateSchema.partial().openapi("TodoGroupUpdate");
