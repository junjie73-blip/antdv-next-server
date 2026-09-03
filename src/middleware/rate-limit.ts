import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { env } from "@/config/env.js";

export const globalRateLimit = rateLimit({
  windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
  max: parseInt(env.RATE_LIMIT_MAX, 10),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.user?.id || ipKeyGenerator(req),
  handler: (req, res) => {
    res
      .status(429)
      .json({ success: false, message: "请求过于频繁，请稍后再试" });
  },
});

export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5,
  skipSuccessfulRequests: false,
  keyGenerator: (req: any) => req.user?.id || ipKeyGenerator(req),
  handler: (req, res) => {
    res
      .status(429)
      .json({ success: false, message: "尝试次数过多，请15分钟后再试" });
  },
});
