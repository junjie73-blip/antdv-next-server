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
