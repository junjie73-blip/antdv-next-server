import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@common/security/jwt.js";
import { prisma } from "@/config/database.js";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
  };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "未提供认证令牌" });
    }

    const token = auth.slice(7);
    const payload = await verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub as string },
    });

    if (!user || user.status !== "ACTIVE") {
      return res
        .status(401)
        .json({ success: false, message: "用户无效或已禁用" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "令牌无效或已过期" });
  }
}
