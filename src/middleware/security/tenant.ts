import { Request, Response, NextFunction } from "express";
import { AppError } from "@/core/errors.js";
import { prisma } from "@/config/database.js";
import { redis } from "@/config/redis.js";
import { isWhitelisted } from "./auth.js";
import { env } from "@/config/env.js";

const TENANT_CACHE_TTL = 300;

export async function tenantResolver(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (isWhitelisted(req.path)) return next();

    const headerTenant = req.headers["x-tenant-id"] as string | undefined;
    const userTenant = (req as any).user?.tenantId;

    let tenantId: string | undefined;

    if (userTenant) {
      if (headerTenant && headerTenant !== userTenant) {
        return next(new AppError("租户标识与当前用户不匹配", 403, 403));
      }
      tenantId = userTenant;
    } else if (headerTenant) {
      if (!env.ALLOW_UNAUTH_TENANT_HEADER) {
        return next(new AppError("未认证请求不允许指定租户", 401, 401));
      }
      tenantId = headerTenant;
    }

    if (!tenantId) return next(new AppError("缺少租户标识", 400, 400));

    const tenant = await getCachedTenant(tenantId);
    if (!tenant) return next(new AppError("租户不存在或已禁用", 403, 403));
    if (tenant.expire_time && new Date(tenant.expire_time) < new Date()) {
      return next(new AppError("租户已过期", 403, 403));
    }

    (req as any).tenantId = tenantId;
    next();
  } catch (err) {
    next(err);
  }
}

export async function getCachedTenant(tenantId: string) {
  const key = `tenant:info:${tenantId}`;
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
  } catch {}
  const tenant = await prisma.sys_tenant.findFirst({
    where: { tenant_id: tenantId, is_deleted: 0, status: "1" },
    select: { tenant_id: true, expire_time: true },
  });
  if (tenant) {
    try {
      await redis.setex(key, TENANT_CACHE_TTL, JSON.stringify(tenant));
    } catch {}
  }
  return tenant;
}
