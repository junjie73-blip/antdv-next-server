import { encrypt, decrypt } from "@/core/security/crypto.js";
import { logger } from "@/platform/logger/index.js";

const ENC_PREFIX = "enc:";

/** 对指定字段加密（拼接 enc: 前缀，避免二次加密） */
export function encryptSensitive(
  config: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...config };
  for (const k of keys) {
    const v = out[k];
    if (typeof v === "string" && v.length > 0 && !v.startsWith(ENC_PREFIX)) {
      out[k] = ENC_PREFIX + encrypt(v);
    }
  }
  return out;
}

/** 解密指定字段（无前缀视为明文） */
export function decryptSensitive(
  config: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...config };
  for (const k of keys) {
    const v = out[k];
    if (typeof v === "string" && v.startsWith(ENC_PREFIX)) {
      try {
        out[k] = decrypt(v.slice(ENC_PREFIX.length));
      } catch (err) {
        logger.warn({ err, key: k }, "[storage-backend] decrypt failed");
        out[k] = "";
      }
    }
  }
  return out;
}
