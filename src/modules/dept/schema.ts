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
      .string()
      .regex(/^[01]$/)
      .default("1")
      .openapi({ description: "状态：0-禁用，1-启用" }),
  })
  .openapi("DeptCreate");

export const DeptUpdateSchema =
  DeptCreateSchema.partial().openapi("DeptUpdate");

export const DeptListSchema = z
  .object({
    deptName: z.string().optional().openapi({ description: "部门名称过滤" }),
    status: z
      .string()
      .regex(/^[01]$/)
      .optional()
      .openapi({ description: "状态过滤" }),
    fields: z
      .string()
      .optional()
      .openapi({ description: "查询字段，逗号分隔" }),
  })
  .openapi("DeptList");
export const DeptImportRowSchema = z.object({
  部门编码: z.string().min(2).max(64),
  部门名称: z.string().min(2).max(128),
  上级部门编码: z.string().max(64).optional().default(""),
  负责人: z.string().max(64).optional().default(""),
  联系电话: z.string().max(32).optional().default(""),
  邮箱: z
    .union([z.string().email(), z.literal("")])
    .optional()
    .default(""),
  排序: z.coerce.number().int().default(0),
  状态: z.enum(["启用", "禁用"]).default("启用"),
});

export const DeptExportColumns = [
  { header: "部门编码", key: "dept_code", width: 20 },
  { header: "部门名称", key: "dept_name", width: 24 },
  { header: "上级部门编码", key: "parent_code", width: 20 },
  { header: "负责人", key: "leader", width: 16 },
  { header: "联系电话", key: "phone", width: 16 },
  { header: "邮箱", key: "email", width: 24 },
  { header: "排序", key: "sort_order", width: 8 },
  {
    header: "状态",
    key: "status",
    width: 8,
    formatter: (v: string) => (v === "1" ? "启用" : "禁用"),
  },
] as const;
