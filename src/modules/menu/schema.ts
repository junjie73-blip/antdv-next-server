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
      .number()
      .int()
      .min(0)
      .max(1)
      .default(1)
      .openapi({ description: "状态：0-禁用，1-启用" }),
  })
  .openapi("MenuCreate");

export const MenuUpdateSchema =
  MenuCreateSchema.partial().openapi("MenuUpdate");

export const MenuListSchema = z
  .object({
    menuName: z.string().optional().openapi({ description: "菜单名称过滤" }),
    status: z.string().optional().openapi({ description: "状态过滤" }),
  })
  .openapi("MenuList");
