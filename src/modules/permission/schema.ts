import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

export const PermissionCreateSchema = z
  .object({
    permCode: z
      .string()
      .min(2)
      .max(128)
      .openapi({ description: "权限编码，如 system:user:create" }),
    permName: z.string().min(2).max(128).openapi({ description: "权限名称" }),
    resourceType: z
      .string()
      .max(32)
      .openapi({ description: "资源类型，如 api、button" }),
    action: z
      .string()
      .max(32)
      .optional()
      .openapi({ description: "动作，如 create、read、update、delete" }),
    description: z
      .string()
      .max(512)
      .optional()
      .openapi({ description: "描述" }),
    status: z
      .string()
      .min(0)
      .max(1)
      .default("1")
      .openapi({ description: "状态：0-禁用，1-启用" }),
  })
  .openapi("PermissionCreate");

export const PermissionUpdateSchema =
  PermissionCreateSchema.partial().openapi("PermissionUpdate");

export const PermissionListSchema = z
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
    permCode: z.string().optional().openapi({ description: "权限编码过滤" }),
    permName: z.string().optional().openapi({ description: "权限名称过滤" }),
    resourceType: z
      .string()
      .optional()
      .openapi({ description: "资源类型过滤" }),
    status: z.string().optional().openapi({ description: "状态过滤" }),
  })
  .openapi("PermissionList");
export const PermissionImportRowSchema = z.object({
  权限编码: z.string().min(2).max(128),
  权限名称: z.string().min(2).max(128),
  资源类型: z.string().max(32).default("api"),
  动作: z.string().max(32).optional().default(""),
  描述: z.string().max(512).optional().default(""),
  状态: z.enum(["启用", "禁用"]).default("启用"),
});

export const PermissionExportColumns = [
  { header: "权限编码", key: "perm_code", width: 30 },
  { header: "权限名称", key: "perm_name", width: 24 },
  { header: "资源类型", key: "resource_type", width: 16 },
  { header: "动作", key: "action", width: 12 },
  { header: "描述", key: "description", width: 40 },
  {
    header: "状态",
    key: "status",
    width: 8,
    formatter: (v: string) => (v === "1" ? "启用" : "禁用"),
  },
] as const;
