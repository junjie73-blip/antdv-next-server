import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

export const LoginSchema = z
  .object({
    tenantCode: z.string().min(1).max(64).openapi({ description: "租户编码" }),
    username: z.string().min(1).openapi({ description: "用户名" }),
    password: z.string().min(1).openapi({ description: "密码" }),
    deviceId: z.string().max(64).optional(),
    captchaId: z.string().optional(),
    captchaCode: z.string().optional(),
  })
  .openapi("Login");

export const RefreshTokenSchema = z
  .object({ refreshToken: z.string().min(1) })
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
    tenantCode: z.string().min(2).max(64),
    tenantName: z.string().min(2).max(128),
    username: z.string().min(3).max(64),
    password: z.string().min(6).max(64),
    email: z.string().email().optional(),
    phone: z.string().max(32).optional(),
  })
  .openapi("Register");

export const ForgotPasswordSchema = z
  .object({
    tenantCode: z.string().min(2).max(64),
    username: z.string().min(1).max(64),
    oldPassword: z.string().min(1).max(64),
    newPassword: z.string().min(6).max(64),
  })
  .openapi("ForgotPassword");
export const CancelAccountSchema = z
  .object({
    password: z.string().min(1).max(64).openapi({ description: "登录密码" }),
    reason: z.string().max(512).optional().openapi({ description: "注销原因" }),
  })
  .openapi("CancelAccount");

export type CancelAccountDTO = z.infer<typeof CancelAccountSchema>;
export const SendEmailCodeSchema = z
  .object({
    email: z.string().email().max(128).openapi({ description: "邮箱地址" }),
    scene: z
      .enum(["email_bind", "email_change"])
      .default("email_bind")
      .openapi({ description: "场景：绑定 / 换绑" }),
  })
  .openapi("SendEmailCode");

export const VerifyEmailSchema = z
  .object({
    email: z.string().email().max(128).openapi({ description: "邮箱地址" }),
    code: z.string().min(4).max(8).openapi({ description: "验证码" }),
  })
  .openapi("VerifyEmail");

export type SendEmailCodeDTO = z.infer<typeof SendEmailCodeSchema>;
export type VerifyEmailDTO = z.infer<typeof VerifyEmailSchema>;
