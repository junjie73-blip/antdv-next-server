import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { TEMPLATE_CATEGORIES, MAX_TEMPLATE_SIZE } from "./constants.js";

extendZodWithOpenApi(z);

const KEY_RE = /^[a-zA-Z][a-zA-Z0-9_.-]{0,127}$/;

export const TemplateCreateSchema = z
  .object({
    templateKey: z.string().regex(KEY_RE),
    templateName: z.string().min(1).max(128),
    category: z.enum(TEMPLATE_CATEGORIES as [string, ...string[]]),
    content: z.string().min(1).max(MAX_TEMPLATE_SIZE),
    changelog: z.string().max(512).optional(),
  })
  .openapi("GenTemplateCreate");

export const TemplateUpdateSchema = z
  .object({
    templateName: z.string().min(1).max(128).optional(),
    content: z.string().min(1).max(MAX_TEMPLATE_SIZE).optional(),
    changelog: z.string().max(512).optional(),
  })
  .openapi("GenTemplateUpdate");

export const TemplateListSchema = z
  .object({
    pageNum: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    category: z.enum(TEMPLATE_CATEGORIES as [string, ...string[]]).optional(),
    keyword: z.string().max(128).optional(),
  })
  .openapi("GenTemplateList");

export const TemplateRollbackSchema = z
  .object({ version: z.number().int().min(1) })
  .openapi("GenTemplateRollback");

export type TemplateCreateDTO = z.infer<typeof TemplateCreateSchema>;
export type TemplateUpdateDTO = z.infer<typeof TemplateUpdateSchema>;
export type TemplateListDTO = z.infer<typeof TemplateListSchema>;
