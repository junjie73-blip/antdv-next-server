import { Request, Response, NextFunction } from "express";
import { jwtVerify, SignJWT } from "jose";
import { env as config } from "@config/env.js";
import { redis, getSession } from "@config/redis.js";
import { logger } from "@core/logger/index.js";
import { AuthenticationError } from "@/core/errors.js";

const secret = new TextEncoder().encode(config.JWT_SECRET);
// 定义无需认证的路径白名单
const AUTH_WHITELIST = [
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/refresh",
  "/health",
  "/api/docs", // Swagger UI
  "/api/docs.json", // Swagger JSON
  "/uploads", // 静态文件（可选）
];
export interface TokenPayload {
  userId: string;
  tenantId: string;
  username: string;
  roles: string[];
}

export async function generateTokens(payload: TokenPayload) {
  const accessToken = await new SignJWT({ ...payload, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(config.JWT_EXPIRES_IN)
    .sign(secret);

  const refreshToken = await new SignJWT({
    userId: payload.userId,
    type: "refresh",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(config.JWT_REFRESH_EXPIRES_IN)
    .sign(new TextEncoder().encode(config.JWT_REFRESH_SECRET));
  // 存储会话（略）
  return { accessToken, refreshToken };
}
function extractValidToken(rawToken: string): string | null {
  // 移除可能的前后空格、引号等
  let token = rawToken.trim().replace(/^"|"$/g, "");
  // 如果包含逗号，可能混杂了其他字段，尝试提取第一个 JWT（以 eyJ 开头）
  const jwtMatch = token.match(
    /eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/,
  );
  if (jwtMatch) {
    return jwtMatch[0];
  }
  // 否则原样返回
  return token;
}
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (
    AUTH_WHITELIST.some(
      (path) => req.path === path || req.path.startsWith(path),
    )
  ) {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthenticationError("Missing or invalid authorization header");
    }

    const rawToken = authHeader.slice(7);
    const token = extractValidToken(rawToken);
    if (!token) {
      throw new AuthenticationError("Invalid token format");
    }
    console.log("Token:", token);
    const { payload } = await jwtVerify(token, secret, { clockTolerance: 60 });
    if (payload.type !== "access") {
      throw new AuthenticationError("Invalid token type");
    }

    // Check session in Redis
    const session = await redis.get(`access:${payload.userId}`);
    if (!session) {
      throw new AuthenticationError("Session expired");
    }

    (req as any).user = {
      userId: payload.userId as string,
      tenantId: payload.tenantId as string,
      username: payload.username as string,
      roles: payload.roles as string[],
    };
    (req as any).tenantId = payload.tenantId as string;
    next();
  } catch (err) {
    next(err);
  }
}

export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }
  authMiddleware(req, _res, next).catch(() => next());
}
