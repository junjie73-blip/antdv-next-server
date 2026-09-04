import { Request, Response, NextFunction } from "express";
import { jwtVerify, SignJWT } from "jose";
import { env as config } from "@config/env.js";
import { redis, getSession } from "@config/redis.js";
import { logger } from "@core/logger/index.js";
import { AuthenticationError } from "@/core/errors.js";

const secret = new TextEncoder().encode(config.JWT_SECRET);

export interface TokenPayload {
  userId: string;
  tenantId: string;
  username: string;
  roles: string[];
}

export async function generateTokens(
  payload: TokenPayload,
): Promise<{ accessToken: string; refreshToken: string }> {
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

  await redis.setex(`refresh:${payload.userId}`, 7 * 24 * 3600, refreshToken);
  return { accessToken, refreshToken };
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthenticationError("Missing or invalid authorization header");
    }

    const token = authHeader.slice(7);
    const { payload } = await jwtVerify(token, secret, { clockTolerance: 60 });

    if (payload.type !== "access") {
      throw new AuthenticationError("Invalid token type");
    }

    // Check session in Redis
    const session = await getSession(`access:${payload.userId}`);
    if (!session) {
      throw new AuthenticationError("Session expired");
    }

    (req as any).user = {
      userId: payload.userId as string,
      tenantId: payload.tenantId as string,
      username: payload.username as string,
      roles: payload.roles as string[],
    };

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
