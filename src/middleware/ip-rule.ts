import type { Request, Response, NextFunction } from "express";
import { getIpRules } from "@/modules/ip-rule/cache.js";
import { checkIpAgainstRules } from "@/modules/ip-rule/matcher.js";
import { logger } from "@/core/logger/index.js";
import { getClientIp } from "@/common/utils/ip.js";

/**
 * IP 规则中间件
 * - 需要 tenantId，因此必须在 authMiddleware 之后使用
 * - 未登录接口（登录、注册）需要特殊处理，见下方"登录接口处理"
 */
export async function ipRuleMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const tenantId = (req as any).tenantId;
    // 无租户上下文时跳过（比如登录接口）
    if (!tenantId) return next();
    // 白名单路径（比如健康检查、静态资源）跳过
    if (isWhitelistPath(req.path)) return next();

    const clientIp = getClientIp(req);
    if (!clientIp) return next();

    const rules = await getIpRules(tenantId);
    // 无规则直接放行
    if (rules.white.length === 0 && rules.black.length === 0) return next();

    const result = checkIpAgainstRules(clientIp, rules);
    if (!result.allowed) {
      logger.warn(
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
    logger.error({ e }, "IP rule middleware error");
    // 中间件故障不阻塞请求（可改成拒绝，取决于安全等级）
    next();
  }
}

function isWhitelistPath(path: string): boolean {
  // 静态资源、健康检查等不影响业务安全的路径跳过
  return (
    path.startsWith("/api/v1/health") ||
    path.startsWith("/api/v1/uploads") ||
    path.startsWith("/api/docs") ||
    path.startsWith("/api/auth/login") ||
    path.startsWith("/favicon.ico") ||
    path.startsWith("/api/v1/auth/forgot-password") ||
    path.startsWith("/api/v1/auth/register") ||
    path.startsWith("/api/v1/auth/password-policy") ||
    path.startsWith("/api/v1/auth/captcha")
  );
}
