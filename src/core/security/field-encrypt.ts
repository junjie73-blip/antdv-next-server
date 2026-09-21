import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";
import { env } from "@/config/env.js";

const ALGORITHM = "aes-256-gcm";
const KEY = createHash("sha256").update(env.ENCRYPTION_KEY).digest();

export function encryptField(plain: string): string {
  if (!plain) return "";
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptField(cipherText: string): string {
  if (!cipherText) return "";
  const [ivB64, tagB64, dataB64] = cipherText.split(":");
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8",
  );
}

/** 用于查找的哈希（不可逆） */
export function hashField(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}

/** 脱敏展示 */
export function maskPhone(phone: string): string {
  if (!phone) return "";
  return phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
}

export function maskEmail(email: string): string {
  if (!email) return "";
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return `${"*".repeat(Math.min(name.length, 3))}@${domain}`;
}
