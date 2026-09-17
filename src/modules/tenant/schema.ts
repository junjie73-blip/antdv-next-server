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

export type TenantCreateDto = z.infer<typeof TenantCreateSchema>;
export type TenantUpdateDto = z.infer<typeof TenantUpdateSchema>;
export type TenantListDto = z.infer<typeof TenantListSchema>;
export type TenantExportDto = z.infer<typeof TenantExportSchema>;

export const TenantImportRowSchema = z.object({
  租户编码: z.string().min(2).max(64),
  租户名称: z.string().min(2).max(128),
  联系人: z.string().max(64).optional().default(""),
  联系电话: z.string().max(32).optional().default(""),
  联系邮箱: z
    .union([z.string().email(), z.literal("")])
    .optional()
    .default(""),
  状态: z.enum(["启用", "禁用"]).default("启用"),
  过期时间: z.string().optional().default(""),
});

export const TenantExportColumns = [
  { header: "租户编码", key: "tenant_code", width: 20 },
  { header: "租户名称", key: "tenant_name", width: 30 },
  { header: "联系人", key: "contact_name", width: 16 },
  { header: "联系电话", key: "contact_phone", width: 16 },
  { header: "联系邮箱", key: "contact_email", width: 24 },
  {
    header: "状态",
    key: "status",
    width: 8,
    formatter: (v: string) => (v === "1" ? "启用" : "禁用"),
  },
  {
    header: "过期时间",
    key: "expire_time",
    width: 20,
    formatter: (v: any) =>
      v ? new Date(v).toISOString().slice(0, 19).replace("T", " ") : "永久",
  },
  {
    header: "创建时间",
    key: "created_at",
    width: 20,
    formatter: (v: any) =>
      v ? new Date(v).toISOString().slice(0, 19).replace("T", " ") : "",
  },
] as const;

// 兼容老导出
export const TenantExportSchema = z
  .object({
    keyword: z.string().optional(),
    status: z.string().optional(),
  })
  .openapi("TenantExport");
