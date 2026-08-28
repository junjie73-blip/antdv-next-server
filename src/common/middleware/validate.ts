import { Request, Response, NextFunction } from "express";
import { prisma } from "@/config/database.js";

export interface TenantRequest extends Request {
  tenantId?: string;
}

/**
 * 租户解析中间件
 * 优先级：header x-tenant-id > query.tenantId > 已认证用户的 tenantId
 */
export async function tenantMiddleware(
  req: TenantRequest,
  res: Response,
  next: NextFunction,
) {
  let tenantId: string | undefined =
    (req.headers["x-tenant-id"] as string) ||
    (req.query.tenantId as string) ||
    (req as any).user?.tenantId;

  if (!tenantId) {
    return res.status(400).json({
      success: false,
      message: "缺少租户标识（tenantId）",
    });
  }

  // 校验租户是否存在且有效
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId, status: "ACTIVE" },
  });

  if (!tenant) {
    return res.status(403).json({
      success: false,
      message: "租户无效或已禁用",
    });
  }

  req.tenantId = tenantId;
  next();
}
