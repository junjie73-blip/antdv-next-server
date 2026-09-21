import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

export const MenuCreateSchema = z
  .object({
    parentId: z
      .string()
      .uuid()
      .optional()
      .openapi({ description: "父菜单ID，顶级可传全零UUID或省略" }),
    menuName: z.string().min(1).max(128).openapi({ description: "菜单名称" }),
    menuType: z
      .number()
      .int()
      .min(1)
      .max(3)
      .openapi({ description: "类型：1-目录，2-菜单，3-按钮" }),
    icon: z.string().max(128).optional().openapi({ description: "图标" }),
    path: z.string().max(256).optional().openapi({ description: "路由路径" }),
    component: z
      .string()
      .max(256)
      .optional()
      .openapi({ description: "前端组件路径" }),
    permission: z
      .string()
      .max(128)
      .optional()
      .openapi({ description: "权限标识，如 system:user:create" }),
    sortOrder: z.number().int().default(0).openapi({ description: "排序值" }),
    status: z
      .string()
      .regex(/^[01]$/, { message: "状态必须是0或1" })
      .default("1")
      .openapi({ description: "状态：0-禁用，1-启用" }),
  })
  .openapi("MenuCreate");

export const MenuUpdateSchema =
  MenuCreateSchema.partial().openapi("MenuUpdate");

export const MenuListSchema = z
  .object({
    menuName: z.string().optional().openapi({ description: "菜单名称过滤" }),
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
  .openapi("MenuList");
/** 菜单导入的 Excel 行 Schema */
export const MenuImportRowSchema = z.object({
  菜单名称: z.string().min(1).max(128),
  类型: z.enum(["目录", "菜单", "按钮"]),
  上级菜单: z.string().max(128).optional().default(""),
  图标: z.string().max(128).optional().default(""),
  路由地址: z.string().max(256).optional().default(""),
  组件路径: z.string().max(256).optional().default(""),
  权限标识: z.string().max(128).optional().default(""),
  排序: z.coerce.number().int().default(0),
  状态: z.enum(["启用", "禁用"]).default("启用"),
});

export const MenuExportColumns = [
  { header: "菜单名称", key: "menu_name", width: 24 },
  {
    header: "类型",
    key: "menu_type",
    width: 10,
    formatter: (v: number) => (v === 1 ? "目录" : v === 2 ? "菜单" : "按钮"),
  },
  { header: "上级菜单", key: "parent_name", width: 20 },
  { header: "图标", key: "icon", width: 20 },
  { header: "路由地址", key: "path", width: 24 },
  { header: "组件路径", key: "component", width: 24 },
  { header: "权限标识", key: "permission", width: 24 },
  { header: "排序", key: "sort_order", width: 8 },
  {
    header: "状态",
    key: "status",
    width: 8,
    formatter: (v: string) => (v === "1" ? "启用" : "禁用"),
  },
] as const;
