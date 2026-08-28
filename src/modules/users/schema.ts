import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const UserSchema = z
  .object({
    id: z.string(),
    username: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    name: z.string().nullable(),
    nickname: z.string().nullable(),
    avatar: z.string().nullable(),
    role: z.string().nullable(),
    status: z.string(),
    tenantId: z.string(),
    mfaEnabled: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("User");

export const CreateUserBody = z
  .object({
    username: z.string().min(3).max(50),
    password: z.string().min(8).max(100),
    nickname: z.string().min(1).max(50).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    name: z.string().min(1).max(50).optional(),
    role: z.string().optional(),
    tenantId: z.string(),
    status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]).optional(),
  })
  .openapi("CreateUserBody");

export const UpdateUserBody = z
  .object({
    username: z.string().min(3).max(50).optional(),
    nickname: z.string().min(1).max(50).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    name: z.string().min(1).max(50).optional(),
    avatar: z.string().optional(),
    role: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]).optional(),
  })
  .openapi("UpdateUserBody");

export const UpdatePasswordBody = z
  .object({
    oldPassword: z.string().min(1),
    newPassword: z.string().min(8).max(100),
  })
  .openapi("UpdatePasswordBody");

export const AssignRoleBody = z
  .object({
    roleId: z.string(),
  })
  .openapi("AssignRoleBody");

export const UserListQuery = z.object({
  tenantId: z.string(),
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]).optional(),
  keyword: z.string().optional(),
});
