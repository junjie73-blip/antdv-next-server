import type { Request, Response, NextFunction } from "express";
import { logger } from "@/platform/logger/index.js";

import {
  getUserPermissions,
  getUserRoles,
  checkPermission,
} from "@/modules/rbac/service/index.js";

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
  permissions?: string[];
  anyPermissions?: string[];
  roles?: string[];
  requireAuth?: boolean;
}

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

      if (requireAuth && !user) {
        return res.status(401).json({
          code: 401,
          message: "未认证",
          data: null,
          timestamp: Date.now(),
        });
      }
      if (!user) return next();

      const { userId, tenantId } = user;

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
