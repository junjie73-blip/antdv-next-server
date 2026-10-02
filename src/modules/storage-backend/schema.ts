import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { BACKEND_TYPES } from "./constants.js";

extendZodWithOpenApi(z);

export const StorageBackendCreateSchema = z
  .object({
    backendType: z.enum(BACKEND_TYPES as [string, ...string[]]),
    backendName: z.string().min(1).max(128),
    config: z.record(z.string(), z.unknown()),
    priority: z.number().int().min(0).max(100).default(0),
    remark: z.string().max(512).optional(),
  })
  .openapi("StorageBackendCreate");

export const StorageBackendUpdateSchema = z
  .object({
    backendName: z.string().min(1).max(128).optional(),
    config: z.record(z.string(), z.unknown()).optional(),
    priority: z.number().int().min(0).max(100).optional(),
    remark: z.string().max(512).nullable().optional(),
  })
  .openapi("StorageBackendUpdate");

export const StorageBackendListSchema = z
  .object({
    pageNum: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    backendType: z.enum(BACKEND_TYPES as [string, ...string[]]).optional(),
    keyword: z.string().max(128).optional(),
  })
  .openapi("StorageBackendList");

/** 敏感字段替换为 "******"，服务端保留原值 */
export const StorageBackendActivateSchema = z
  .object({ backendId: z.string().uuid() })
  .openapi("StorageBackendActivate");

export type StorageBackendCreateDTO = z.infer<
  typeof StorageBackendCreateSchema
>;
export type StorageBackendUpdateDTO = z.infer<
  typeof StorageBackendUpdateSchema
>;
export type StorageBackendListDTO = z.infer<typeof StorageBackendListSchema>;
