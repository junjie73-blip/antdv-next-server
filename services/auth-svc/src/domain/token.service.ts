import { SignJWT, jwtVerify } from "jose";
import { randomUUID } from "node:crypto";
import { redis } from "../config/redis.js";
import { env } from "../config/env.js";
import type { TokenPayload } from "@saas/contracts";

const ACCESS_SECRET = new TextEncoder().encode(env.JWT_SECRET);
const REFRESH_SECRET = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

/** 解析 "3h" / "15m" / "30d" → 秒 */
export function parseExpirationToSeconds(expr: string): number {
  const m = expr.match(/^(\d+)([smhd])$/);
  if (!m) return 3600;
  const n = Number(m[1]);
  const unit = m[2];
  switch (unit) {
    case "s":
      return n;
    case "m":
      return n * 60;
    case "h":
      return n * 3600;
    case "d":
      return n * 86400;
    default:
      return 3600;
  }
}

export interface IssueTokensInput {
  userId: string;
  tenantId: string;
  username: string;
  roles: string[];
  deviceId?: string;
}

export interface IssueTokensOutput {
  accessToken: string;
  refreshToken: string;
  deviceId: string;
}

export async function issueTokens(
  input: IssueTokensInput,
): Promise<IssueTokensOutput> {
  const deviceId = input.deviceId ?? randomUUID();

  const accessToken = await new SignJWT({
    userId: input.userId,
    tenantId: input.tenantId,
    username: input.username,
    roles: input.roles,
    deviceId,
    type: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(ACCESS_SECRET);

  const refreshToken = await new SignJWT({
    userId: input.userId,
    tenantId: input.tenantId,
    deviceId,
    type: "refresh",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRES_IN)
    .sign(REFRESH_SECRET);

  const accessTtl = parseExpirationToSeconds(env.JWT_EXPIRES_IN);
  const refreshTtl = parseExpirationToSeconds(env.JWT_REFRESH_EXPIRES_IN);

  await Promise.all([
    redis.setex(
      `access:${input.tenantId}:${input.userId}:${deviceId}`,
      accessTtl,
      "valid",
    ),
    redis.setex(
      `refresh:${input.tenantId}:${input.userId}:${deviceId}`,
      refreshTtl,
      refreshToken,
    ),
  ]);

  return { accessToken, refreshToken, deviceId };
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, ACCESS_SECRET, {
    clockTolerance: 60,
  });
  if (payload.type !== "access") {
    throw new Error("Invalid token type");
  }
  return payload as unknown as TokenPayload;
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, REFRESH_SECRET, {
    clockTolerance: 60,
  });
  if (payload.type !== "refresh") {
    throw new Error("Invalid token type");
  }
  return payload as unknown as TokenPayload;
}

export async function revokeSession(
  tenantId: string,
  userId: string,
  deviceId: string,
): Promise<void> {
  await Promise.all([
    redis.del(`access:${tenantId}:${userId}:${deviceId}`),
    redis.del(`refresh:${tenantId}:${userId}:${deviceId}`),
  ]);
}
