import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

export const LoginSchema = z
  .object({
    username: z.string().min(1),
    password: z.string().min(1),
  })
  .openapi("Login");

export const RefreshTokenSchema = z
  .object({
    refreshToken: z.string().min(1),
  })
  .openapi("RefreshToken");

export const ChangePasswordSchema = z
  .object({
    oldPassword: z.string().min(1),
    newPassword: z.string().min(6).max(64),
  })
  .openapi("ChangePassword");
export const UpdateProfileSchema = z
  .object({
    realName: z.string().max(64).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(32).optional(),
    avatar: z.string().max(512).optional(),
  })
  .openapi("UpdateProfile");
export const RegisterSchema = z
  .object({
    tenantName: z.string().min(2).max(128).openapi({ description: "租户名称" }),
    tenantCode: z
      .string()
      .min(2)
      .max(64)
      .openapi({ description: "租户编码（唯一）" }),
    username: z
      .string()
      .min(3)
      .max(64)
      .openapi({ description: "管理员用户名" }),
    password: z
      .string()
      .min(6)
      .max(64)
      .openapi({ description: "密码（至少6位）" }),
    email: z.string().email().optional().openapi({ description: "邮箱" }),
    phone: z.string().max(32).optional().openapi({ description: "手机号" }),
  })
  .openapi("Register");
