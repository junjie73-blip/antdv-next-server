import { Request, Response, NextFunction } from "express";
import { AppError } from "./error-handler.js";
import { prisma } from "@/config/database.js";

/**
 * 租户解析中间件
 * 从请求头或 Token 中提取租户信息并注入请求上下文
 */
export async function tenantResolver(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    let tenantId = req.headers["x-tenant-id"] as string;

    // 如果请求头中没有，尝试从已认证用户信息中获取
    if (!tenantId && req.user) {
      tenantId = req.user.tenantId;
    }

    if (!tenantId) {
      next(new AppError(400, "缺少租户标识", 400));
      return;
    }

    // 验证租户是否存在且有效
    const tenant = await prisma.sys_tenant.findFirst({
      where: {
        tenant_id: tenantId,
        is_deleted: 0,
        status: "1",
      },
    });

    if (!tenant) {
      next(new AppError(403, "租户不存在或已禁用", 403));
      return;
    }

    // 检查租户是否过期
    if (tenant.expire_time && new Date(tenant.expire_time) < new Date()) {
      next(new AppError(403, "租户已过期", 403));
      return;
    }

    req.tenantId = tenantId;
    next();
  } catch (err) {
    next(err);
  }
}
