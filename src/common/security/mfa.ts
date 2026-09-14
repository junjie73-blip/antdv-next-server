import { createHmac, randomBytes } from "crypto";

// ⭐ Base32 编码（RFC 4648）
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(bytes: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export class MfaService {
  static generateSecret(): string {
    const bytes = randomBytes(20);
    return base32Encode(bytes); // ⭐
  }

  static generateQrCodeUrl(
    secret: string,
    email: string,
    issuer: string,
  ): string {
    const label = encodeURIComponent(`${issuer}:${email}`);
    const encodedSecret = encodeURIComponent(secret);
    return `otpauth://totp/${label}?secret=${encodedSecret}&issuer=${encodeURIComponent(issuer)}`;
  }

  static verifyToken(secret: string, token: string, window = 1): boolean {
    const now = Math.floor(Date.now() / 1000 / 30);
    for (let i = -window; i <= window; i++) {
      if (this.generateTotp(secret, now + i) === token) return true;
    }
    return false;
  }

  private static generateTotp(secret: string, step: number): string {
    const key = Buffer.from(secret, "ascii"); // ⭐ Base32 secret 直接用 ascii 字节
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64BE(BigInt(step), 0);
    const hmac = createHmac("sha1", key).update(buf).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code =
      (((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)) %
      1_000_000;
    return code.toString().padStart(6, "0");
  }
}
