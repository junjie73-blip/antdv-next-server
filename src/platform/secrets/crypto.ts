import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { AppError } from "@/core/errors.js";

const ALGORITHM = "aes-256-gcm";
const IV_LEN = 12; // GCM 推荐 96 bit
const TAG_LEN = 16;
const PREFIX = "enc:v1:"; // 版本前缀，便于将来换算法

/**
 * 从主密钥派生 32 字节密钥
 * SECRET_MASTER_KEY 可以是任意长度字符串
 */
function deriveKey(masterKey: string): Buffer {
  if (!masterKey || masterKey.length < 16) {
    throw new AppError("SECRET_MASTER_KEY 至少 16 字符", 500001, 500);
  }
  return createHash("sha256").update(masterKey).digest();
}

/**
 * 加密
 * 输出格式：enc:v1:<iv-hex>:<tag-hex>:<cipher-hex>
 */
export function encrypt(plain: string, masterKey: string): string {
  if (typeof plain !== "string") {
    throw new AppError("encrypt: 明文必须是字符串", 500001, 500);
  }

  const key = deriveKey(masterKey);
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let cipherHex = cipher.update(plain, "utf8", "hex");
  cipherHex += cipher.final("hex");
  const tag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString("hex")}:${tag.toString("hex")}:${cipherHex}`;
}

/**
 * 解密
 * 兼容：如果输入不以 enc:v1: 开头，视为明文直接返回
 */
export function decrypt(cipherText: string, masterKey: string): string {
  if (typeof cipherText !== "string") {
    throw new AppError("decrypt: 密文必须是字符串", 500001, 500);
  }

  // 明文直接返回（用于开发环境或历史数据）
  if (!cipherText.startsWith(PREFIX)) {
    return cipherText;
  }

  const body = cipherText.slice(PREFIX.length);
  const parts = body.split(":");
  if (parts.length !== 3) {
    throw new AppError("decrypt: 密文格式无效", 500001, 500);
  }

  const [ivHex, tagHex, dataHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");

  if (iv.length !== IV_LEN || tag.length !== TAG_LEN) {
    throw new AppError("decrypt: IV/Tag 长度无效", 500001, 500);
  }

  const key = deriveKey(masterKey);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  try {
    let plain = decipher.update(dataHex, "hex", "utf8");
    plain += decipher.final("utf8");
    return plain;
  } catch {
    throw new AppError("decrypt: 解密失败，密钥错误或数据损坏", 500001, 500);
  }
}

/** 判断是否为密文 */
export function isEncrypted(value: string): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

/** 生成随机密钥（用于运维初始化） */
export function generateMasterKey(): string {
  return randomBytes(32).toString("hex"); // 64 位 hex
}
