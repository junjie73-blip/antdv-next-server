import type { Request, Response, NextFunction } from "express";
import { AppError } from "@/core/errors.js";

// TODO(phase4): 迁移到 @/modules/mfa/service.js
import { verifyToken as verifyMfaToken } from "@/modules/mfa/service.js";

export async function requireMfaMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = (req as any).user;
    if (!user?.userId) throw new AppError("未认证", 401001, 401);

    const mfaToken =
      (req.headers["x-mfa-token"] as string) || (req.body as any)?._mfaToken;

    if (!mfaToken || !/^\d{6}$/.test(mfaToken)) {
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
    next(err);
  }
}
