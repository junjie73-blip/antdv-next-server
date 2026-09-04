import { Request, Response, NextFunction } from "express";
import {
  checkPermission,
  checkAllPermissions,
  checkAnyPermission,
} from "./service.js";
import { RequiredPermission } from "./types.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    username: string;
    roles: string[];
  };
}

export function requirePermission(resource: string, action: string) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.user) {
      return res.status(401).json({ code: 401001, message: "Unauthorized" });
    }
    const permCode = `${resource}:${action}`;
    const hasPerm = await checkPermission(
      req.user.userId,
      req.user.tenantId,
      permCode,
    );
    if (!hasPerm) {
      return res
        .status(403)
        .json({ code: 403001, message: "Forbidden: insufficient permissions" });
    }
    next();
  };
}

export function requireAllPermissions(...permissions: RequiredPermission[]) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.user)
      return res.status(401).json({ code: 401001, message: "Unauthorized" });
    const permCodes = permissions.map((p) => `${p.resource}:${p.action}`);
    const hasAll = await checkAllPermissions(
      req.user.userId,
      req.user.tenantId,
      permCodes,
    );
    if (!hasAll) {
      return res
        .status(403)
        .json({ code: 403001, message: "Forbidden: all permissions required" });
    }
    next();
  };
}

export function requireAnyPermission(...permissions: RequiredPermission[]) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.user)
      return res.status(401).json({ code: 401001, message: "Unauthorized" });
    const permCodes = permissions.map((p) => `${p.resource}:${p.action}`);
    const hasAny = await checkAnyPermission(
      req.user.userId,
      req.user.tenantId,
      permCodes,
    );
    if (!hasAny) {
      return res
        .status(403)
        .json({
          code: 403001,
          message: "Forbidden: at least one permission required",
        });
    }
    next();
  };
}
