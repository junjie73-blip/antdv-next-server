import type { Request, Response, NextFunction } from "express";
import { logger } from "@/platform/logger/index.js";
import { getClientIp } from "@/shared/utils/ip.js";

// TODO(phase4): 迁移到 @/modules/ip-rule/*
import { getIpRules } from "@/modules/ip-rule/cache.js";
import { checkIpAgainstRules } from "@/modules/ip-rule/matcher.js";

const WHITELIST_PREFIXES = [
  "/api/v1/health",
  "/api/v1/uploads",
  "/api/docs",
  "/api/v1/auth/login",
  "/favicon.ico",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/register",
  "/api/v1/auth/password-policy",
  "/api/v1/auth/captcha",
  "/api/v1/tenant/options",
];

function isWhitelistPath(path: string): boolean {
  return WHITELIST_PREFIXES.some((p) => path.startsWith(p));
}

export async function ipRuleMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return next();
    if (isWhitelistPath(req.path)) return next();

    const clientIp = getClientIp(req);
    if (!clientIp) return next();

    const rules = await getIpRules(tenantId);
    if (rules.white.length === 0 && rules.black.length === 0) return next();

    const result = checkIpAgainstRules(clientIp, rules);
    if (!result.allowed) {
      logger.info(
        { ip: clientIp, tenantId, path: req.path, reason: result.reason },
        "IP blocked",
      );
      return res.status(403).json({
        code: 403,
        message: `访问被拒绝：${result.reason}`,
        data: null,
        timestamp: Date.now(),
      });
    }

    next();
  } catch (e) {
    logger.error({ err: e }, "IP rule middleware error");
    next();
  }
}
