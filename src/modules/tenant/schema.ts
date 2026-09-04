import z from "zod";

export const TenantCreateSchema = z.object({
  tenant_code: z.string().min(4).max(10),
  tenant_name: z.string().min(4).max(255),
  contact_name: z.string().min(4).max(255),
  contact_email: z.string().email(),
  contact_phone: z.string().min(10).max(15),
  status: z.number().optional().default(1),
});
export const TenantUpdateSchema = TenantCreateSchema.partial();

export const TenantListSchema = z.object({
  tenant_code: z.string().optional(),
  tenant_name: z.string().optional(),
  contact_name: z.string().optional(),
  contact_email: z.string().optional(),
  contact_phone: z.string().optional(),
  status: z.number().optional(),
});
