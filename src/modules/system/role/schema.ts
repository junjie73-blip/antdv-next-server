import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);
/**
+ * 数据范围枚举
+ */
export const RoleDataScopeEnum = z.enum(["1", "2", "3", "4", "5"]).openapi({
  description: "数据范围：1-全部 2-自定义 3-本部门 4-本部门及以下 5-仅本人",
});

export const RoleCreateSchema = z
  .object({
    roleCode: z.string().min(2).max(64).openapi({ description: "角色编码" }),
    roleName: z.string().min(2).max(128).openapi({ description: "角色名称" }),
    description: z
      .string()
      .max(512)
      .optional()
      .openapi({ description: "描述" }),
    sortOrder: z.number().int().default(0).openapi({ description: "排序值" }),
    status: z
      .string()
      .regex(/^[01]$/)
      .default("1")
      .openapi({ description: "状态：0-禁用，1-启用" }),
    dataScope: RoleDataScopeEnum.default("1").openapi({
      description: "数据范围：1-全部 2-自定义 3-本部门 4-本部门及以下 5-仅本人",
    }),
  })
  .openapi("RoleCreate");

export const RoleUpdateSchema =
  RoleCreateSchema.partial().openapi("RoleUpdate");

export const RoleListSchema = z
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
    keyword: z.string().optional().openapi({ description: "角色编码或名称" }),
    status: z
      .string()
      .regex(/^[01]$/)
      .optional()
      .openapi({ description: "状态过滤：'0'或'1'" }),
    fields: z
      .string()
      .optional()
      .openapi({ description: "查询字段，逗号分隔" }),
  })
  .openapi("RoleList");

// 用于分配菜单、权限、用户的请求体 schema
export const RoleAssignMenusSchema = z
  .object({
    menuIds: z.array(z.string().uuid()).openapi({ description: "菜单ID数组" }),
  })
  .openapi("RoleAssignMenus");

export const RoleAssignPermissionsSchema = z
  .object({
    permIds: z.array(z.string().uuid()).openapi({ description: "权限ID数组" }),
  })
  .openapi("RoleAssignPermissions");

export const RoleAssignUsersSchema = z
  .object({
    userIds: z.array(z.string().uuid()).openapi({ description: "用户ID数组" }),
  })
  .openapi("RoleAssignUsers");
export const RoleAssignDeptsSchema = z
  .object({
    deptIds: z.array(z.string().uuid()).openapi({ description: "部门ID数组" }),
  })
  .openapi("RoleAssignDepts");
