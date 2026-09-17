import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

// ============================================================
// ⭐ 资源类型：去掉 menu / button
// 菜单 / 按钮权限在「角色管理」里通过 sys_role_menu 分配
// ============================================================
export const PERMISSION_RESOURCE_TYPES = ["api", "data", "other"] as const;
export type PermissionResourceType = (typeof PERMISSION_RESOURCE_TYPES)[number];

export const PERMISSION_ACTIONS = [
  "create",
  "read",
  "update",
  "delete",
  "list",
  "detail",
  "export",
  "import",
] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

/** 资源类型是否需要 action */
export function needAction(resourceType: string): boolean {
  return resourceType !== "data";
}

/** 资源类型 → 中文标签 */
export const RESOURCE_TYPE_LABEL: Record<PermissionResourceType, string> = {
  api: "接口",
  data: "数据",
  other: "其他",
};

/** 中文（或英文）→ 资源类型，导入时用 */
export const LABEL_TO_RESOURCE_TYPE: Record<string, PermissionResourceType> = {
  接口: "api",
  数据: "data",
  其他: "other",
  api: "api",
  data: "data",
  other: "other",
};

// ============================================================
// Schema
// ============================================================
const resourceTypeSchema = z
  .enum(PERMISSION_RESOURCE_TYPES)
  .openapi({ description: "资源类型：api、data、other" });

const actionSchema = z.enum(PERMISSION_ACTIONS).openapi({
  description:
    "动作：create、read、update、delete、list、detail、export、import",
});

export const PermissionCreateSchema = z
  .object({
    permCode: z
      .string()
      .min(2)
      .max(128)
      .openapi({ description: "权限编码，如 system:user:create" }),
    permName: z.string().min(2).max(128).openapi({ description: "权限名称" }),
    resourceType: resourceTypeSchema,
    action: actionSchema
      .optional()
      .nullable()
      .openapi({ description: "动作（data 类型可空）" }),
    description: z
      .string()
      .max(512)
      .optional()
      .openapi({ description: "描述" }),
    status: z
      .string()
      .regex(/^[01]$/)
      .default("1")
      .openapi({ description: "状态：0-禁用，1-启用" }),
  })
  .refine(
    (data) => {
      // ⭐ data 类型不需要 action；其它类型必须传
      if (data.resourceType === "data") return true;
      return !!data.action;
    },
    { message: "该资源类型必须指定动作", path: ["action"] },
  )
  .openapi("PermissionCreate");

export const PermissionUpdateSchema =
  PermissionCreateSchema.openapi("PermissionUpdate");

export const PermissionListSchema = z
  .object({
    pageNum: z.number().int().positive().default(1),
    pageSize: z.number().int().positive().max(100).default(10),
    permCode: z.string().optional(),
    permName: z.string().optional(),
    resourceType: resourceTypeSchema.optional(),
    status: z.string().optional(),
  })
  .openapi("PermissionList");

// ============================================================
// 导入行（Excel 里是中文，改为中文枚举 + 转换函数）
// ============================================================
export const PermissionImportRowSchema = z.object({
  权限编码: z.string().min(2).max(128),
  权限名称: z.string().min(2).max(128),
  资源类型: z.enum(["接口", "数据", "其他"]).default("接口"),
  动作: z.string().max(32).optional().default(""),
  描述: z.string().max(512).optional().default(""),
  状态: z.enum(["启用", "禁用"]).default("启用"),
});

// ============================================================
// 导出列（resource_type 需要格式化）
// ============================================================
export const PermissionExportColumns = [
  { header: "权限编码", key: "perm_code", width: 30 },
  { header: "权限名称", key: "perm_name", width: 24 },
  {
    header: "资源类型",
    key: "resource_type",
    width: 16,
    formatter: (v: string) =>
      RESOURCE_TYPE_LABEL[v as PermissionResourceType] || v,
  },
  { header: "动作", key: "action", width: 12 },
  { header: "描述", key: "description", width: 40 },
  {
    header: "状态",
    key: "status",
    width: 8,
    formatter: (v: string) => (v === "1" ? "启用" : "禁用"),
  },
] as const;
