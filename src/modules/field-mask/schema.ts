import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);
export const MASK_TYPES = [
  "phone",
  "email",
  "idCard",
  "name",
  "custom",
] as const;
export type MaskType = (typeof MASK_TYPES)[number];
/* ============================================================
 * 通用字段定义
 * ============================================================ */
const FIELD_MASK_BASE = z.object({
  /** 掩码名称 */
  name: z.string().min(1).max(64).openapi({
    description: "掩码名称",
    example: "手机号脱敏",
  }),

  /** 字段路径 */
  field: z.string().min(1).max(128).openapi({
    description: "字段路径",
    example: "user.phone",
  }),

  /** 掩码类型 */
  maskType: z.enum(["phone", "email", "idCard", "name", "custom"]).openapi({
    description: "掩码类型",
  }),

  /** 自定义正则（maskType=custom 时必填） */
  pattern: z.string().max(512).optional(),

  /** 替换字符 */
  replaceChar: z.string().length(1).default("*"),

  /** 保留前 N 位 */
  keepPrefix: z.number().int().min(0).max(20).default(3),

  /** 保留后 N 位 */
  keepSuffix: z.number().int().min(0).max(20).default(4),

  /** 描述 */
  description: z.string().max(512).optional(),

  /** 状态 */
  status: z.enum(["0", "1"]).default("1"),
  /** 角色范围 */
  roleScope: z.string().max(128).optional(),
});

/* ============================================================
 * Create Schema（完整字段 + 校验）
 * ============================================================ */
export const FieldMaskCreateSchema = z
  .object({
    name: z.string().min(1).max(64).openapi({ description: "掩码名称" }),
    field: z
      .string()
      .min(1)
      .max(128)
      .openapi({ description: "字段路径，如 user.phone" }),
    maskType: z.enum(MASK_TYPES).openapi({ description: "掩码类型" }),
    pattern: z
      .string()
      .max(512)
      .optional()
      .openapi({ description: "自定义正则（仅 custom 使用）" }),
    replaceChar: z
      .string()
      .min(1)
      .max(1)
      .default("*")
      .openapi({ description: "替换字符" }),
    keepPrefix: z.number().int().min(0).max(20).default(3),
    keepSuffix: z.number().int().min(0).max(20).default(4),
    description: z.string().max(512).optional(),
    status: z.enum(["0", "1"]).default("1"),
  })
  .superRefine((val, ctx) => {
    if (val.maskType === "custom" && !val.pattern) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "自定义类型必须提供正则 pattern",
        path: ["pattern"],
      });
    }
  })
  .openapi("FieldMaskCreate");

/* ============================================================
 * Update Schema（所有字段可选 + 同样的校验）
 * ============================================================ */
export const FieldMaskUpdateSchema = z
  .object({
    name: z.string().min(1).max(64).optional(),
    field: z.string().min(1).max(128).optional(),
    maskType: z.enum(MASK_TYPES).optional(),
    pattern: z.string().max(512).nullable().optional(),
    replaceChar: z.string().min(1).max(1).optional(),
    keepPrefix: z.number().int().min(0).max(20).optional(),
    keepSuffix: z.number().int().min(0).max(20).optional(),
    description: z.string().max(512).nullable().optional(),
    status: z.enum(["0", "1"]).optional(),
  })
  .openapi("FieldMaskUpdate");

/* ============================================================
 * Query Schema
 * ============================================================ */
export const FieldMaskListSchema = z
  .object({
    pageNum: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    keyword: z.string().max(128).optional(),
    maskType: z.enum(MASK_TYPES).optional(),
    status: z.enum(["0", "1"]).optional(),
  })
  .openapi("FieldMaskList");

/* ============================================================
 * 批量删除
 * ============================================================ */
export const FieldMaskBatchDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

/* ============================================================
 * 类型导出
 * ============================================================ */
export type FieldMaskCreateDTO = z.infer<typeof FieldMaskCreateSchema>;
export type FieldMaskUpdateDTO = z.infer<typeof FieldMaskUpdateSchema>;
export type FieldMaskListDTO = z.infer<typeof FieldMaskListSchema>;
export type FieldMaskBatchDeleteDTO = z.infer<
  typeof FieldMaskBatchDeleteSchema
>;
