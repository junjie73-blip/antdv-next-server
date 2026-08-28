import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const MenuSchema = z
  .object({
    id: z.string(),
    parentId: z.string().nullable(),
    name: z.string(),
    code: z.string(),
    path: z.string().nullable(),
    component: z.string().nullable(),
    icon: z.string().nullable(),
    sortOrder: z.number(),
    menuType: z.enum(["DIRECTORY", "MENU", "BUTTON"]),
    isExternal: z.boolean(),
    isCache: z.boolean(),
    isVisible: z.boolean(),
    permissionCode: z.string().nullable(),
    status: z.string(),
    children: z.array(z.any()).optional(),
  })
  .openapi("Menu");

export const CreateMenuBody = z
  .object({
    parentId: z.string().optional().nullable(),
    name: z.string().min(1).max(50),
    code: z.string().min(1).max(50),
    path: z.string().optional().nullable(),
    component: z.string().optional().nullable(),
    icon: z.string().optional().nullable(),
    sortOrder: z.number().optional().default(0),
    menuType: z.enum(["DIRECTORY", "MENU", "BUTTON"]).default("MENU"),
    isExternal: z.boolean().optional().default(false),
    isCache: z.boolean().optional().default(true),
    isVisible: z.boolean().optional().default(true),
    permissionCode: z.string().optional().nullable(),
  })
  .openapi("CreateMenuBody");

export const AssignRoleBody = z
  .object({
    roleId: z.string(),
    menuIds: z.array(z.string()),
  })
  .openapi("AssignRoleBody");
