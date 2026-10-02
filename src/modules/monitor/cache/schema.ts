import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const CacheScanSchema = z
  .object({
    pattern: z.string().min(1).max(256),
    /** 单次返回上限 */
    limit: z.coerce.number().int().min(1).max(1000).default(100),
  })
  .openapi("CacheScan");

export const CacheClearGroupSchema = z
  .object({
    group: z.string().min(1).max(64),
    /** 二次确认（防止误操作） */
    confirm: z.literal(true),
  })
  .openapi("CacheClearGroup");

export const CacheDeleteKeySchema = z
  .object({
    key: z.string().min(1).max(512),
  })
  .openapi("CacheDeleteKey");

export const CacheStatsQuerySchema = z
  .object({
    group: z.string().max(64).optional(),
  })
  .openapi("CacheStatsQuery");

export type CacheScanDTO = z.infer<typeof CacheScanSchema>;
export type CacheClearGroupDTO = z.infer<typeof CacheClearGroupSchema>;
export type CacheDeleteKeyDTO = z.infer<typeof CacheDeleteKeySchema>;
