import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";
import { env } from "@/config/env.js";

const ALGORITHM = "aes-256-gcm";
const KEY = scryptSync(env.ENCRYPTION_KEY, "salt", 32);

/**
 * 加密敏感数据（需要还原的场景，如 MFA secret）
 * @returns iv:authTag:ciphertext
 */
export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * 解密敏感数据
 */
export function decrypt(encryptedText: string): string {
  if (typeof encryptedText !== "string" || encryptedText.length === 0) {
    throw new Error("decrypt: input must be a non-empty string");
  }
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    throw new Error("decrypt: invalid ciphertext format");
  }
  const [ivHex, authTagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// ============================================================
// 密码专用 API —— 一律走 bcrypt（哈希，不可逆）
// ============================================================

/**
 * 哈希密码（存储用）
 * ⚠️ 名字不叫 encryptPassword 了，避免和 AES 混淆
 */
export async function hashPassword(password: string): Promise<string> {
  if (typeof password !== "string" || password.length === 0) {
    throw new Error("hashPassword: password must be a non-empty string");
  }
  const bcrypt = await import("bcryptjs");
  const saltRounds = parseInt(env.BCRYPT_SALT_ROUNDS || "10", 10);
  return bcrypt.hash(password, saltRounds);
}

/**
 * 校验密码
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  if (typeof password !== "string" || typeof hash !== "string") return false;
  if (!password || !hash) return false;
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(password, hash);
}
