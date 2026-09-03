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

    const user = await prisma.sys_user.findUnique({
      where: { user_id: payload.sub as string },
    });

    if (!user || user.status !== 1) {
      return res
        .status(401)
        .json({ success: false, message: "用户无效或已禁用" });
    }

    req.user = {
      id: user.user_id,
      email: user.email ?? "",
      role: "",
      tenantId: user.tenant_id,
    };

    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "令牌无效或已过期" });
  }
}
