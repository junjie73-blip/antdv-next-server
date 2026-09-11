import { Request, Response, NextFunction } from "express";
import { jwtVerify, SignJWT } from "jose";
import { env as config } from "@config/env.js";
import { redis, getSession, parseExpirationToSeconds } from "@config/redis.js";
import { logger } from "@core/logger/index.js";
import { AuthenticationError } from "@/core/errors.js";
import { getKickedFlag } from "@/core/ws/force-logout.js";
const secret = new TextEncoder().encode(config.JWT_SECRET);
// 定义无需认证的路径白名单
const AUTH_WHITELIST = [
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/refresh",
  "/api/v1/auth/logout",
  "/health",
  "/api/docs", // Swagger UI
  "/api/docs.json", // Swagger JSON
  "/uploads", // 静态文件（可选）
  "/favicon.ico",
];
export interface TokenPayload {
  userId: string;
  tenantId: string;
  username: string;
  roles?: string[];
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
  // ✅ 保存 refresh token
  await redis.setex(`refresh:${payload.userId}`, 3 * 24 * 3600, refreshToken);

  // ✅ 保存 access token 会话标记（TTL 与 access token 有效期一致）
  const accessTtl = parseExpirationToSeconds(config.JWT_EXPIRES_IN);
  await redis.setex(`access:${payload.userId}`, accessTtl, "valid");
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
  res: Response,
  next: NextFunction,
): Promise<void> {
  // 白名单检查（保持不变）
  if (
    AUTH_WHITELIST.some(
      (path) => req.path === path || req.path.startsWith(path),
    )
  ) {
    return next();
  }
  console.log(
    req.path,
    "req.path",
    AUTH_WHITELIST.some(
      (path) => req.path === path || req.path.startsWith(path),
    ),
  );
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthenticationError("Missing or invalid authorization header");
    }

    const rawToken = authHeader.slice(7);
    const token = extractValidToken(rawToken);
    console.log(token, "token", authHeader);
    if (!token) {
      throw new AuthenticationError("Invalid token format");
    }

    const { payload } = await jwtVerify(token, secret, { clockTolerance: 60 });
    if (payload.type !== "access") {
      throw new AuthenticationError("Invalid token type");
    }

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
    const kicked = await getKickedFlag(req.user.userId);
    if (kicked) {
      throw new AuthenticationError(kicked.reason || "您已被强制下线");
    }

    next();
  } catch (err) {
    // 记录错误，但统一返回 401
    console.error("Auth failed:", err);
    res.status(401).json({
      code: 401001,
      message: "未认证或令牌无效",
      data: null,
      timestamp: Date.now(),
    });
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
