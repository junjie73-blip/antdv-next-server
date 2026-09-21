import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";
import { env } from "@/config/env.js";

const ALGORITHM = "aes-256-gcm";
const KEY = createHash("sha256").update(env.ENCRYPTION_KEY).digest();

export function encrypt(text: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  if (typeof encryptedText !== "string" || encryptedText.length === 0) {
    throw new Error("decrypt: input must be a non-empty string");
  }
  const parts = encryptedText.split(":");
  if (parts.length !== 3) throw new Error("decrypt: invalid ciphertext format");
  const [ivHex, authTagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
