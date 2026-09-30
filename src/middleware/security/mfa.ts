import type { Request, Response, NextFunction } from "express";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";

import { verifyToken as verifyMfaToken } from "@/modules/system/mfa/service.js";

const MFA_TOKEN_RE = /^\d{6}$/;

export async function requireMfaMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = (req as any).user;
    if (!user?.userId) throw new AppError("未认证", 401001, 401);

    const rawToken = req.headers["x-mfa-token"];
    const mfaToken = Array.isArray(rawToken) ? rawToken[0] : rawToken;

    if (typeof mfaToken !== "string" || !MFA_TOKEN_RE.test(mfaToken)) {
      return res.status(428).json({
        code: 428001,
        message: "需要 MFA 校验，请提供 X-MFA-Token",
        data: null,
        timestamp: Date.now(),
      });
    }

    const result = await verifyMfaToken(user.userId, mfaToken);
    if (!result.valid) throw new AppError("MFA 验证码错误", 400001, 400);

    next();
  } catch (err) {
    logger.warn({ err, path: req.path }, "[mfa] verify failed");
    next(err);
  }
}
