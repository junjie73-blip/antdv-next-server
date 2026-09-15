import { prisma } from "@/config/database.js";
import { redis } from "@/config/redis.js";
import { compare, hash } from "bcryptjs";
import { AppError } from "@/core/errors.js";

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
  historyCount: number;
  expireDays: number;
}

const POLICY_CACHE_KEY = "password-policy";
const POLICY_CACHE_TTL = 300;

const DEFAULT_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false,
  historyCount: 5,
  expireDays: 90,
};

/** 读取策略（优先 Redis，其次 DB） */
export async function getPasswordPolicy(): Promise<PasswordPolicy> {
  try {
    const cached = await redis.get(POLICY_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}

  const configs = await prisma.sys_config.findMany({
    where: { config_key: { startsWith: "password." }, is_deleted: 0 },
  });

  const policy: PasswordPolicy = { ...DEFAULT_POLICY };
  for (const c of configs) {
    const key = c.config_key.replace("password.", "");
    const value = c.config_value ?? "";
    switch (key) {
      case "minLength":
        policy.minLength = Number(value) || 8;
        break;
      case "requireUppercase":
        policy.requireUppercase = value === "true";
        break;
      case "requireLowercase":
        policy.requireLowercase = value === "true";
        break;
      case "requireNumber":
        policy.requireNumber = value === "true";
        break;
      case "requireSpecial":
        policy.requireSpecial = value === "true";
        break;
      case "historyCount":
        policy.historyCount = Number(value) || 5;
        break;
      case "expireDays":
        policy.expireDays = Number(value) || 0;
        break;
    }
  }

  try {
    await redis.setex(
      POLICY_CACHE_KEY,
      POLICY_CACHE_TTL,
      JSON.stringify(policy),
    );
  } catch {}

  return policy;
}

/** 校验密码强度 */
export function validatePasswordStrength(
  password: string,
  policy: PasswordPolicy,
): void {
  const errors: string[] = [];

  if (password.length < policy.minLength) {
    errors.push(`密码至少 ${policy.minLength} 位`);
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("需要包含大写字母");
  }
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("需要包含小写字母");
  }
  if (policy.requireNumber && !/\d/.test(password)) {
    errors.push("需要包含数字");
  }
  if (policy.requireSpecial && !/[^A-Za-z0-9]/.test(password)) {
    errors.push("需要包含特殊字符");
  }

  if (errors.length > 0) {
    throw new AppError(errors.join("；"), 400001, 400);
  }
}

/** 校验密码历史（禁止复用最近 N 次） */
export async function validatePasswordHistory(
  userId: string,
  tenantId: string,
  newPassword: string,
  policy: PasswordPolicy,
): Promise<void> {
  if (policy.historyCount <= 0) return;

  const history = await prisma.sys_password_history.findMany({
    where: { user_id: userId, tenant_id: tenantId },
    orderBy: { created_at: "desc" },
    take: policy.historyCount,
  });

  for (const h of history) {
    if (await compare(newPassword, h.password)) {
      throw new AppError(
        `新密码不能与最近 ${policy.historyCount} 次使用的密码相同`,
        400001,
        400,
      );
    }
  }
}

/** 保存密码历史 */
export async function savePasswordHistory(
  userId: string,
  tenantId: string,
  passwordHash: string,
  policy: PasswordPolicy,
): Promise<void> {
  await prisma.sys_password_history.create({
    data: { user_id: userId, tenant_id: tenantId, password: passwordHash },
  });

  // 只保留最近 N+5 条，防止无限增长
  const keep = policy.historyCount + 5;
  const old = await prisma.sys_password_history.findMany({
    where: { user_id: userId, tenant_id: tenantId },
    orderBy: { created_at: "desc" },
    skip: keep,
    select: { id: true },
  });
  if (old.length > 0) {
    await prisma.sys_password_history.deleteMany({
      where: { id: { in: old.map((o) => o.id) } },
    });
  }
}

/** 检查密码是否过期 */
export function isPasswordExpired(
  passwordChangedAt: Date | null,
  policy: PasswordPolicy,
): boolean {
  if (policy.expireDays <= 0) return false;
  if (!passwordChangedAt) return true;
  const days = (Date.now() - passwordChangedAt.getTime()) / 86400000;
  return days > policy.expireDays;
}
