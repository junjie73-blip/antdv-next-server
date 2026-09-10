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
    tenantCode: z
      .string()
      .min(2)
      .max(64)
      .openapi({ description: "租户编码（必须已存在）" }),
    tenantName: z
      .string()
      .min(2)
      .max(128)
      .openapi({ description: "租户名称（必须与编码匹配）" }),
    username: z.string().min(3).max(64).openapi({ description: "用户名" }),
    password: z.string().min(6).max(64).openapi({ description: "密码" }),
    email: z.string().email().optional(),
    phone: z.string().max(32).optional(),
  })
  .openapi("Register");
