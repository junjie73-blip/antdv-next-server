import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { MASK_TYPES } from "./constants.js";

extendZodWithOpenApi(z);

export const FieldMaskCreateSchema = z
  .object({
    resource: z.string().min(1).max(64),
    field: z.string().min(1).max(64),
    /** "all" 或 JSON 数组 ["ADMIN","HR"] */
    roleScope: z.string().min(1).max(256),
    maskType: z.enum(MASK_TYPES as [string, ...string[]]),
    maskRule: z.string().max(256).nullable().optional(),
    enabled: z.number().int().min(0).max(1).default(1),
    remark: z.string().max(512).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.maskType === "regex" && !val.maskRule) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "regex 类型必须提供 maskRule",
        path: ["maskRule"],
      });
    }
    if (val.maskType === "custom" && !val.maskRule) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "custom 类型必须提供 maskRule",
        path: ["maskRule"],
      });
    }
    if (val.roleScope !== "all") {
      try {
        const arr = JSON.parse(val.roleScope);
        if (!Array.isArray(arr)) throw new Error();
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'roleScope 必须是 "all" 或 JSON 数组字符串',
          path: ["roleScope"],
        });
      }
    }
  })
  .openapi("FieldMaskCreate");

export const FieldMaskUpdateSchema =
  FieldMaskCreateSchema.partial().openapi("FieldMaskUpdate");

export const FieldMaskListSchema = z
  .object({
    pageNum: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    resource: z.string().max(64).optional(),
    field: z.string().max(64).optional(),
    enabled: z.coerce.number().int().min(0).max(1).optional(),
  })
  .openapi("FieldMaskList");

export type FieldMaskCreateDTO = z.infer<typeof FieldMaskCreateSchema>;
export type FieldMaskUpdateDTO = z.infer<typeof FieldMaskUpdateSchema>;
export type FieldMaskListDTO = z.infer<typeof FieldMaskListSchema>;
