import svgCaptcha from "svg-captcha";
import { randomUUID } from "node:crypto";
import { redis } from "@/config/redis.js";

const CAPTCHA_PREFIX = "captcha:";
const CAPTCHA_TTL = 300; // 5 分钟

export interface CaptchaResult {
  captchaId: string;
  svg: string;
}

/** 生成验证码 */
export async function createCaptcha(): Promise<CaptchaResult> {
  const captcha = svgCaptcha.create({
    size: 4,
    noise: 2,
    color: true,
    background: "#f5f5f5",
    ignoreChars: "0oO1ilI",
    width: 120,
    height: 40,
  });

  const captchaId = randomUUID();
  const key = `${CAPTCHA_PREFIX}${captchaId}`;

  // 存小写，比对时也转小写
  await redis.setex(key, CAPTCHA_TTL, captcha.text.toLowerCase());

  return { captchaId, svg: captcha.data };
}

/** 校验（一次性，校验后立即删除） */
export async function verifyCaptcha(
  captchaId: string,
  code: string,
): Promise<boolean> {
  if (!captchaId || !code) return false;
  const key = `${CAPTCHA_PREFIX}${captchaId}`;
  const stored = await redis.get(key);
  if (!stored) return false;
  await redis.del(key);
  return stored === code.toLowerCase();
}
