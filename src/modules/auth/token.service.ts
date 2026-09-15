import { SignJWT, jwtVerify } from "jose";
import { randomUUID } from "node:crypto";
import { redis, parseExpirationToSeconds } from "@/config/redis.js";
import { env as config } from "@/config/env.js";

const ACCESS_SECRET = new TextEncoder().encode(config.JWT_SECRET);
const REFRESH_SECRET = new TextEncoder().encode(config.JWT_REFRESH_SECRET);

export interface TokenPayload {
  userId: string;
  tenantId: string;
  username: string;
  roles?: string[];
  deviceId?: string;
}

/** 签发 access + refresh token 并写 Redis */
export async function issueTokens(payload: TokenPayload) {
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

/** 校验 refresh token */
export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, REFRESH_SECRET, {
    clockTolerance: 60,
  });
  return payload;
}

/** 撤销某设备的会话 */
export async function revokeSession(
  tenantId: string,
  userId: string,
  deviceId: string,
) {
  await Promise.all([
    redis.del(`access:${tenantId}:${userId}:${deviceId}`),
    redis.del(`refresh:${tenantId}:${userId}:${deviceId}`),
  ]);
}

/** 撤销用户所有会话 */
export async function revokeAllSessions(userId: string) {
  const { scanAll } = await import("@/config/redis.js");
  const accessKeys = await scanAll(`access:*:${userId}:*`);
  const refreshKeys = await scanAll(`refresh:*:${userId}:*`);
  if (accessKeys.length) await redis.del(...accessKeys);
  if (refreshKeys.length) await redis.del(...refreshKeys);
}
