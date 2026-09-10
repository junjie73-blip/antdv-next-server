import type { Request, Response, NextFunction } from "express";
import { getUserPermissions, getUserRoles } from "@common/rbac/service.js";
import { logger } from "@core/logger/index.js";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    username: string;
    roles?: string[];
  };
  tenantId?: string;
}

export interface RbacOptions {
  /** 需要的权限码（全部满足） */
  permissions?: string[];
  /** 需要的权限码（任意一个满足即可） */
  anyPermissions?: string[];
  /** 需要的角色（任意一个满足即可） */
  roles?: string[];
  /** 是否要求已认证（默认 true） */
  requireAuth?: boolean;
}

/**
 * 通用 RBAC 中间件工厂
 */
export function createRbacMiddleware(options: RbacOptions = {}) {
  const {
    permissions = [],
    anyPermissions = [],
    roles = [],
    requireAuth = true,
  } = options;

  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      // ========== 1. 认证校验 ==========
      if (requireAuth && !user) {
        return res.status(401).json({
          code: 401,
          message: "未认证",
          data: null,
          timestamp: Date.now(),
        });
      }

      if (!user) {
        // requireAuth = false 时，未登录也放行
        return next();
      }

      const { userId, tenantId } = user;

      // ========== 2. 角色校验 ==========
      if (roles.length > 0) {
        const userRoles =
          user.roles && user.roles.length > 0
            ? user.roles
            : await getUserRoles(userId, tenantId);
        const hasRole = roles.some((r) => userRoles.includes(r));
        if (!hasRole) {
          logger.warn(
            { userId, tenantId, required: roles, path: req.path },
            "RBAC denied: role",
          );
          return res.status(403).json({
            code: 403,
            message: "角色权限不足",
            data: null,
            timestamp: Date.now(),
          });
        }
      }

      // ========== 3. 权限校验（全部满足） ==========
      if (permissions.length > 0) {
        const userPerms = await getUserPermissions(userId, tenantId);
        const hasAll =
          userPerms.includes("*") ||
          permissions.every((p) => userPerms.includes(p));
        if (!hasAll) {
          logger.warn(
            { userId, tenantId, required: permissions, path: req.path },
            "RBAC denied: permissions",
          );
          return res.status(403).json({
            code: 403,
            message: "缺少操作权限",
            data: null,
            timestamp: Date.now(),
          });
        }
      }

      // ========== 4. 权限校验（任意一个满足） ==========
      if (anyPermissions.length > 0) {
        const userPerms = await getUserPermissions(userId, tenantId);
        const hasAny =
          userPerms.includes("*") ||
          anyPermissions.some((p) => userPerms.includes(p));
        if (!hasAny) {
          logger.warn(
            { userId, tenantId, required: anyPermissions, path: req.path },
            "RBAC denied: any-permission",
          );
          return res.status(403).json({
            code: 403,
            message: "缺少操作权限",
            data: null,
            timestamp: Date.now(),
          });
        }
      }

      next();
    } catch (err) {
      logger.error({ err }, "RBAC middleware error");
      next(err);
    }
  };
}
