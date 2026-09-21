import { createHmac, randomBytes, timingSafeEqual } from "crypto";

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
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

/** RFC 4648 Base32 解码（忽略 padding） */
function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/, "").toUpperCase().replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const c of clean) {
    const idx = BASE32_ALPHABET.indexOf(c);
    if (idx === -1) throw new Error(`invalid base32 char: ${c}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export class MfaService {
  static generateSecret(): string {
    return base32Encode(randomBytes(20));
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
    if (!/^\d{6}$/.test(token)) return false;
    const now = Math.floor(Date.now() / 1000 / 30);
    for (let i = -window; i <= window; i++) {
      const expected = this.generateTotp(secret, now + i);
      const a = Buffer.from(expected);
      const b = Buffer.from(token);
      if (a.length === b.length && timingSafeEqual(a, b)) return true;
    }
    return false;
  }

  private static generateTotp(secret: string, step: number): string {
    const key = base32Decode(secret);
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
