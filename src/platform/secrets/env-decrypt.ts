import { logger } from "@/platform/logger/index.js";
import { decrypt, isEncrypted } from "./crypto.js";

/**
 * 需要解密的敏感环境变量清单
 * 未列出的变量不处理
 */
const SENSITIVE_ENV_KEYS = [
  "DATABASE_URL",
  "REDIS_PASSWORD",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "ENCRYPTION_KEY",
  "MINIO_SECRET_KEY",
  "MINIO_ACCESS_KEY",
  "SMTP_PASS",
  "SMTP_USER",
  "OSS_ACCESS_KEY_SECRET",
  "OSS_ACCESS_KEY_ID",
  "COS_SECRET_KEY",
  "S3_SECRET_KEY",
  "VAULT_TOKEN",
] as const;

type SensitiveEnvKey = (typeof SENSITIVE_ENV_KEYS)[number];

/**
 * 解密环境变量
 * - 从 process.env 读取
 * - 对敏感字段尝试解密
 * - 解密失败则抛错（fail-fast）
 */
export function decryptEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const masterKey = env.SECRET_MASTER_KEY;

  if (!masterKey) {
    console.warn(
      "[secrets] SECRET_MASTER_KEY 未设置，敏感环境变量将按明文处理",
    );
    return env;
  }

  const result = { ...env };
  let decryptedCount = 0;

  for (const key of SENSITIVE_ENV_KEYS) {
    const value = env[key];
    if (!value || !isEncrypted(value)) continue;

    try {
      result[key] = decrypt(value, masterKey);
      decryptedCount++;
    } catch (err) {
      console.error(
        { err, key },
        `[secrets] 解密 ${key} 失败，请检查 SECRET_MASTER_KEY`,
      );
      throw new Error(
        `环境变量 ${key} 解密失败：请检查 SECRET_MASTER_KEY 是否正确`,
      );
    }
  }

  if (decryptedCount > 0) {
    console.info({ count: decryptedCount }, "[secrets] 环境变量解密完成");
  }

  return result;
}
