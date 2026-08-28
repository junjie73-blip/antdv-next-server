import { createHmac } from "crypto";

export class MfaService {
  // 生成 Base32 secret（简化版 TOTP）
  static generateSecret(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(20));
    return Buffer.from(bytes).toString("base64url").slice(0, 32);
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
      const expected = this.generateTotp(secret, now + i);
      if (expected === token) return true;
    }
    return false;
  }

  private static generateTotp(secret: string, step: number): string {
    const key = Buffer.from(secret, "base64url");
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64BE(BigInt(step), 0);
    const hmac = createHmac("sha1", key).update(buf).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code =
      (((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)) %
      1000000;
    return code.toString().padStart(6, "0");
  }
}
