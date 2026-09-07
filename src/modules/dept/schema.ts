import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

export const DeptCreateSchema = z
  .object({
    parentId: z
      .string()
      .uuid()
      .optional()
      .openapi({ description: "父部门ID，顶级可传全零UUID或省略" }),
    deptCode: z.string().min(2).max(64).openapi({ description: "部门编码" }),
    deptName: z.string().min(2).max(128).openapi({ description: "部门名称" }),
    leader: z.string().max(64).optional().openapi({ description: "负责人" }),
    phone: z.string().max(32).optional().openapi({ description: "联系电话" }),
    email: z.string().email().optional().openapi({ description: "邮箱" }),
    sortOrder: z.number().int().default(0).openapi({ description: "排序值" }),
    status: z
      .number()
      .int()
      .min(0)
      .max(1)
      .default(1)
      .openapi({ description: "状态：0-禁用，1-启用" }),
  })
  .openapi("DeptCreate");

export const DeptUpdateSchema =
  DeptCreateSchema.partial().openapi("DeptUpdate");

export const DeptListSchema = z
  .object({
    deptName: z.string().optional().openapi({ description: "部门名称过滤" }),
    status: z.string().optional().openapi({ description: "状态过滤" }),
  })
  .openapi("DeptList");
