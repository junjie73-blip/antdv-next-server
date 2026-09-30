import { Request, Response, NextFunction } from "express";
import { jwtVerify } from "jose";
import { env as config } from "@/config/env.js";
import { redis } from "@/config/redis.js";
import { logger } from "@/platform/logger/index.js";
import { AuthenticationError } from "@/core/errors.js";
import { getKickedFlagCached } from "@/platform/ws/force-logout.js";
import { error } from "@/shared/http/response.js";

const ACCESS_SECRET = new TextEncoder().encode(config.JWT_SECRET);
const JWT_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
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
  "/api/v1/health",
];

export function isWhitelisted(path: string): boolean {
  return AUTH_WHITELIST.some((p) => {
    if (p.endsWith("/")) return path.startsWith(p);
    return path === p || path.startsWith(`${p}/`);
  });
}

function extractValidToken(rawToken: string): string | null {
  const token = rawToken.trim().replace(/^"|"$/g, "");
  return JWT_RE.test(token) ? token : null;
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

    const session = await redis.get(`access:${tenantId}:${userId}:${deviceId}`);
    if (!session) throw new AuthenticationError("Session expired");

    const kicked = await getKickedFlagCached(userId);
    if (kicked)
      throw new AuthenticationError(kicked.reason || "您已被强制下线");
    (req as any).user = {
      userId,
      tenantId,
      username: payload.username as string,
      roles: (payload.roles as string[]) ?? [],
    };
    (req as any).tenantId = tenantId;
    (req as any).deviceId = deviceId;

    next();
  } catch (err) {
    logger.warn({ err, path: req.path }, "Auth failed");
    error(res, "未认证或令牌无效", 401001, 401);
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
