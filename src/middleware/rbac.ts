import { Request, Response, NextFunction } from "express";
import { rbacService } from "@common/rbac/service.js";
import { auditLog } from "@common/logger/index.js";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
  };
}

/** 生成权限校验中间件（供 BaseController.addRoute 和 scanner 使用） */
export function createRbacMiddleware(
  requiredPermissions: string[] = [],
  requiredRoles: string[] = [],
) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "未认证" });
    }

    const { id: userId, tenantId } = req.user;

    // 角色校验
    if (requiredRoles.length > 0) {
      const ok = await rbacService.hasAnyRole(tenantId, userId, requiredRoles);
      if (!ok) {
        auditLog("rbac.denied", tenantId, userId, {
          reason: "role",
          required: requiredRoles,
        });
        return res
          .status(403)
          .json({ success: false, message: "角色权限不足" });
      }
    }

    // 权限校验
    if (requiredPermissions.length > 0) {
      const ok = await rbacService.hasAllPermissions(
        tenantId,
        userId,
        requiredPermissions,
      );
      if (!ok) {
        auditLog("rbac.denied", tenantId, userId, {
          reason: "permission",
          required: requiredPermissions,
        });
        return res
          .status(403)
          .json({ success: false, message: "缺少操作权限" });
      }
    }

    next();
  };
}
