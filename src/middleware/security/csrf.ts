import { randomBytes } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { AppError } from "@/core/errors.js";
import { env } from "@/config/env.js";
import { AUTH_WHITELIST } from "./auth.js";

const CSRF_COOKIE = "_csrf_token";
const CSRF_HEADER = "x-csrf-token";
const CSRF_TTL = 2 * 60 * 60; // 2 小时

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * 下发 CSRF Token（每次 GET 请求或登录成功后）
 */
export function issueCsrfToken(res: Response): string {
  const token = randomBytes(32).toString("hex");

  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false, // ⭐ 必须前端可读，用于回传
    secure: env.NODE_ENV === "production",
    sameSite: "lax", // ⭐ Lax 足够防 CSRF
    maxAge: CSRF_TTL * 1000,
    path: "/",
  });

  return token;
}

/**
 * 校验 CSRF
 */
export function csrfGuard(req: Request, _res: Response, next: NextFunction) {
  // 1. 安全方法跳过
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // 2. 白名单（如登录接口本身无需 CSRF）
  if (AUTH_WHITELIST.some((p) => req.path.startsWith(p))) {
    return next();
  }

  // 3. 双 Cookie 校验
  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken) {
    return next(new AppError("缺少 CSRF Token", 403001, 403));
  }

  if (cookieToken !== headerToken) {
    return next(new AppError("CSRF Token 不匹配", 403001, 403));
  }

  return next();
}
