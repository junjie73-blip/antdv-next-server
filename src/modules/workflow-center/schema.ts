import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const TodoSourceSchema = z.enum(["approval", "workflow"]);

export const CenterTodoQuerySchema = z
  .object({
    source: TodoSourceSchema.optional(),
    keyword: z.string().max(256).optional(),
    defKey: z.string().max(64).optional(),
    priority: z.coerce.number().int().min(0).max(2).optional(),
    pageNum: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
  })
  .openapi("CenterTodoQuery");

export const CenterCompleteSchema = z
  .object({
    source: TodoSourceSchema,
    id: z.string().uuid(),
    action: z.enum(["approve", "reject"]),
    comment: z.string().max(1000).optional(),
    reasonType: z.string().max(64).optional(),
  })
  .openapi("CenterComplete");

export const CenterBatchCompleteSchema = z
  .object({
    items: z
      .array(
        z.object({
          source: TodoSourceSchema,
          id: z.string().uuid(),
        }),
      )
      .min(1)
      .max(50),
    action: z.enum(["approve", "reject"]),
    comment: z.string().max(1000).optional(),
  })
  .openapi("CenterBatchComplete");

export const CenterDetailQuerySchema = z
  .object({
    source: TodoSourceSchema,
    id: z.string().uuid(),
  })
  .openapi("CenterDetailQuery");
export const CenterInitiatedQuerySchema = z
  .object({
    source: TodoSourceSchema.optional(),
    keyword: z.string().max(256).optional(),
    defKey: z.string().max(64).optional(),
    status: z.string().max(20).optional(),
    pageNum: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
  })
  .openapi("CenterInitiatedQuery");
export const CenterDoneQuerySchema = z
  .object({
    source: TodoSourceSchema.optional(),
    keyword: z.string().max(256).optional(),
    defKey: z.string().max(64).optional(),
    pageNum: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
  })
  .openapi("CenterDoneQuery");

export type CenterDoneQueryDTO = z.infer<typeof CenterDoneQuerySchema>;
export type CenterInitiatedQueryDTO = z.infer<
  typeof CenterInitiatedQuerySchema
>;
export type CenterTodoQueryDTO = z.infer<typeof CenterTodoQuerySchema>;
export type CenterCompleteDTO = z.infer<typeof CenterCompleteSchema>;
export type CenterBatchCompleteDTO = z.infer<typeof CenterBatchCompleteSchema>;
export type CenterDetailQueryDTO = z.infer<typeof CenterDetailQuerySchema>;
