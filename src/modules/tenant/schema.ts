import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

// 租户创建 Schema
export const TenantCreateSchema = z
  .object({
    tenantCode: z.string().min(2).max(64),
    tenantName: z.string().min(2).max(128),
    contactName: z.string().max(64).optional(),
    contactPhone: z.string().max(32).optional(),
    contactEmail: z.string().email().max(128).optional(),
    status: z.number().int().min(0).max(1).default(1),
    expireTime: z.coerce.date().nullable().optional(), // 自动转换字符串为 Date
  })
  .openapi("TenantCreate");

// 租户更新 Schema
export const TenantUpdateSchema = z
  .object({
    tenantCode: z.string().min(2).max(64).optional(),
    tenantName: z.string().min(2).max(128).optional(),
    contactName: z.string().max(64).optional(),
    contactPhone: z.string().max(32).optional(),
    contactEmail: z.string().email().max(128).optional(),
    status: z.number().int().min(0).max(1).optional(),
    expireTime: z.string().datetime().nullable().optional(),
  })
  .openapi("TenantUpdate");

// 租户列表查询 Schema
export const TenantListSchema = z
  .object({
    pageNum: z.number().int().positive().default(1),
    pageSize: z.number().int().positive().max(100).default(10),
    keyword: z.string().optional(),
    status: z.string().optional(),
  })
  .openapi("TenantList");

// 租户导出 Schema（用于筛选导出条件）
export const TenantExportSchema = z
  .object({
    keyword: z.string().optional(),
    status: z.string().optional(),
  })
  .openapi("TenantExport");

export type TenantCreateDto = z.infer<typeof TenantCreateSchema>;
export type TenantUpdateDto = z.infer<typeof TenantUpdateSchema>;
export type TenantListDto = z.infer<typeof TenantListSchema>;
export type TenantExportDto = z.infer<typeof TenantExportSchema>;
