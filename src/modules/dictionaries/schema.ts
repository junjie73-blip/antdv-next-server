import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const DictionarySchema = z
  .object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    category: z.string(),
    description: z.string().nullable(),
    status: z.string(),
  })
  .openapi("Dictionary");

export const DictionaryItemSchema = z
  .object({
    id: z.string(),
    dictId: z.string(),
    label: z.string(),
    value: z.string(),
    sortOrder: z.number(),
    isDefault: z.boolean(),
  })
  .openapi("DictionaryItem");

export const CreateDictionaryBody = z
  .object({
    code: z.string().min(1).max(50),
    name: z.string().min(1).max(50),
    category: z.string().min(1).max(50),
    description: z.string().optional(),
  })
  .openapi("CreateDictionaryBody");

export const CreateDictionaryItemBody = z
  .object({
    dictId: z.string(),
    label: z.string().min(1).max(100),
    value: z.string().min(1).max(100),
    sortOrder: z.number().optional().default(0),
    isDefault: z.boolean().optional().default(false),
  })
  .openapi("CreateDictionaryItemBody");
