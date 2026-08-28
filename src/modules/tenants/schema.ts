import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const TenantSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    domain: z.string().nullable(),
    status: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("Tenant");

export const CreateTenantBody = z
  .object({
    name: z.string().min(1).max(100),
    domain: z.string().optional(),
  })
  .openapi("CreateTenantBody");

export const UpdateTenantBody = z
  .object({
    name: z.string().min(1).max(100).optional(),
    domain: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]).optional(),
  })
  .openapi("UpdateTenantBody");
