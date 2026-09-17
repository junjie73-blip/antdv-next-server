import { Request, Response, NextFunction } from "express";
import { jwtVerify, SignJWT } from "jose";
import { randomUUID } from "node:crypto";
import { env as config } from "@config/env.js";
import { redis, parseExpirationToSeconds } from "@config/redis.js";
import { logger } from "@core/logger/index.js";
import { AuthenticationError } from "@/core/errors.js";
import { getKickedFlag } from "@/core/ws/force-logout.js";

const ACCESS_SECRET = new TextEncoder().encode(config.JWT_SECRET);
const REFRESH_SECRET = new TextEncoder().encode(config.JWT_REFRESH_SECRET);

/**
 * 无需认证的路径白名单
 * - 以 "/" 结尾的项按前缀匹配（如 "/uploads/"）
 * - 其它项按"精确"或"前缀 + /"匹配，避免 /api/v1/auth 误放行 /api/v1/auth/profile
 */
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

export interface TokenPayload {
  userId: string;
  tenantId: string;
  username: string;
  roles?: string[];
  /** 可选：不传则自动生成 */
  deviceId?: string;
}

/** 从原始 Authorization 值里提取 JWT（处理引号 / 逗号 / 混杂文本） */
function extractValidToken(rawToken: string): string | null {
  const token = rawToken.trim().replace(/^"|"$/g, "");
  const jwtMatch = token.match(
    /eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/,
  );
  return jwtMatch ? jwtMatch[0] : token;
}

/**
 * 签发 access / refresh token，并写入 Redis 会话
 * key 约定：
 *   access:{tenantId}:{userId}:{deviceId}  = "valid"
 *   refresh:{tenantId}:{userId}:{deviceId} = refreshToken
 */
export async function generateTokens(payload: TokenPayload) {
  const deviceId = payload.deviceId ?? randomUUID();

  const accessToken = await new SignJWT({
    userId: payload.userId,
    tenantId: payload.tenantId,
    username: payload.username,
    roles: payload.roles ?? [],
    deviceId,
    type: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(config.JWT_EXPIRES_IN)
    .sign(ACCESS_SECRET);

  const refreshToken = await new SignJWT({
    userId: payload.userId,
    tenantId: payload.tenantId,
    deviceId,
    type: "refresh",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(config.JWT_REFRESH_EXPIRES_IN)
    .sign(REFRESH_SECRET);

  const accessTtl = parseExpirationToSeconds(config.JWT_EXPIRES_IN);
  const refreshTtl = parseExpirationToSeconds(config.JWT_REFRESH_EXPIRES_IN);

  await Promise.all([
    redis.setex(
      `access:${payload.tenantId}:${payload.userId}:${deviceId}`,
      accessTtl,
      "valid",
    ),
    redis.setex(
      `refresh:${payload.tenantId}:${payload.userId}:${deviceId}`,
      refreshTtl,
      refreshToken,
    ),
  ]);

  return { accessToken, refreshToken, deviceId };
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (isWhitelisted(req.path)) {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthenticationError("Missing or invalid authorization header");
    }

    const token = extractValidToken(authHeader.slice(7));
    if (!token) {
      throw new AuthenticationError("Invalid token format");
    }

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

    // 校验会话仍在 Redis 中（支持强制下线 / 手动撤销）
    const session = await redis.get(`access:${tenantId}:${userId}:${deviceId}`);
    if (!session) {
      throw new AuthenticationError("Session expired");
    }

    // 挂载上下文
    (req as any).user = {
      userId,
      tenantId,
      username: payload.username as string,
      roles: (payload.roles as string[]) ?? [],
    };
    (req as any).tenantId = tenantId;
    (req as any).deviceId = deviceId;

    // 强制下线标记
    const kicked = await getKickedFlag(userId);
    if (kicked) {
      throw new AuthenticationError(kicked.reason || "您已被强制下线");
    }

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
