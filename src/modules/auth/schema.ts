import { z } from "zod";

export const RegisterBody = z.object({
  username: z.string().min(3).max(50), // 登录账号
  password: z.string().min(8).max(100),
  nickname: z.string().min(1).max(50).optional(), // 显示昵称
  email: z.string().email().optional(), // 邮箱可选
  phone: z.string().optional(), // 手机号可选
  name: z.string().min(1).max(50).optional(), // 真实姓名
  tenantId: z.string(),
});

export const LoginBody = z.object({
  username: z.string().min(3).max(50), // 账号登录
  password: z.string(),
  tenantId: z.string().optional(),
  mfaCode: z.string().length(6).optional(),
});

export const RefreshBody = z.object({
  refreshToken: z.string(),
});

export const ChangePasswordBody = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

export const LogoutBody = z.object({
  refreshToken: z.string().optional(),
});
