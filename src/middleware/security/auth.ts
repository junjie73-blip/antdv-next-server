import { Request, Response, NextFunction } from "express";
import { jwtVerify } from "jose";
import { env as config } from "@/config/env.js";
import { redis } from "@/config/redis.js";
import { logger } from "@/platform/logger/index.js";
import { AuthenticationError } from "@/core/errors.js";
import { getKickedFlagCached } from "@/platform/ws/force-logout.js";

const ACCESS_SECRET = new TextEncoder().encode(config.JWT_SECRET);

export const AUTH_WHITELIST = [
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/refresh",
  "/api/v1/auth/logout",
  "/health",
  "/api/docs",
  "/api/docs.json",
  "/uploads/",
  "/favicon.ico",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/password-policy",
  "/api/v1/auth/captcha",
  "/api/v1/tenant/options",
];

export function isWhitelisted(path: string): boolean {
  return AUTH_WHITELIST.some((p) => {
    if (p.endsWith("/")) return path.startsWith(p);
    return path === p || path.startsWith(`${p}/`);
  });
}

function extractValidToken(rawToken: string): string | null {
  const token = rawToken.trim().replace(/^"|"$/g, "");
  const jwtMatch = token.match(
    /eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/,
  );
  return jwtMatch ? jwtMatch[0] : token;
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (isWhitelisted(req.path)) return next();

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthenticationError("Missing or invalid authorization header");
    }

    const token = extractValidToken(authHeader.slice(7));
    if (!token) throw new AuthenticationError("Invalid token format");

    const { payload } = await jwtVerify(token, ACCESS_SECRET, {
      clockTolerance: 60,
    });
    if (payload.type !== "access") {
      throw new AuthenticationError("Invalid token type");
    }

    const tenantId = payload.tenantId as string | undefined;
    const userId = payload.userId as string | undefined;
    const deviceId = payload.deviceId as string | undefined;
    if (!tenantId || !userId || !deviceId) {
      throw new AuthenticationError("Invalid token payload");
    }

    // ⭐ pipeline 合并两次 Redis 查询
    const results = await redis
      .pipeline()
      .get(`access:${tenantId}:${userId}:${deviceId}`)
      .ttl(`kicked:${userId}`)
      .exec();

    const session = results?.[0]?.[1] as string | null;
    const kickedTtl = Number(results?.[1]?.[1] ?? -2);

    if (!session) throw new AuthenticationError("Session expired");
    if (kickedTtl > 0) {
      // 命中踢下线：直接返回，不再走 getKickedFlag 二次查询
      throw new AuthenticationError("您已被强制下线");
    }

    (req as any).user = {
      userId,
      tenantId,
      username: payload.username as string,
      roles: (payload.roles as string[]) ?? [],
    };
    (req as any).tenantId = tenantId;
    (req as any).deviceId = deviceId;

    // ⭐ 用带负缓存的版本（未踢用户 1s 内不查 Redis）
    const kicked = await getKickedFlagCached(userId);
    if (kicked)
      throw new AuthenticationError(kicked.reason || "您已被强制下线");

    next();
  } catch (err) {
    logger.warn({ err, path: req.path }, "Auth failed");
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
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }
  authMiddleware(req, res, next).catch(() => next());
}
