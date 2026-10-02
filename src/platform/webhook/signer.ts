import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * 生成 webhook 签名
 * 签名内容：`${timestamp}.${body}`
 * Header：X-Signature: sha256=<hex>
 */
export function sign(body: string, secret: string, timestamp: number): string {
  const content = `${timestamp}.${body}`;
  const hex = createHmac("sha256", secret).update(content).digest("hex");
  return `sha256=${hex}`;
}

/**
 * 验证签名（接收方用）
 */
export function verify(
  body: string,
  secret: string,
  signature: string,
  timestamp: number,
  windowSec = 300,
): boolean {
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > windowSec) return false;

  const expected = sign(body, secret, timestamp);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
