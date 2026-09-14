import { Request, Response, NextFunction } from "express";
import { redis } from "@/config/redis.js";
import { error } from "@/common/utils/response.js";
import { getClientIp } from "@/common/utils/ip.js";

const BLOCK_DURATION = 60 * 30; // 30分钟
const THRESHOLD = 100; // 10秒内100请求

export async function ddosProtection(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const ip = getClientIp(req) || "unknown";
  const key = `ratelimit:ip:${ip}`;

  try {
    const blocked = await redis.get(`block:ip:${ip}`);
    if (blocked) {
      return error(res, "IP 已被临时封禁", 403);
    }

    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, 10);
    }

    if (current > THRESHOLD) {
      await redis.setex(`block:ip:${ip}`, BLOCK_DURATION, "1");
      await redis.del(key); // ← 清计数
      return error(res, "触发流量防护，IP 已封禁", 403);
    }

    next();
  } catch {
    next();
  }
}
