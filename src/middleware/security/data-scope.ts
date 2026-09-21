import { prisma } from "@/config/database.js";
import type { NextFunction, Request, Response } from "express";
import { logger } from "@/platform/logger/index.js";
import { redis } from "@/config/redis.js";
import { AppError } from "@/core/errors.js";
import {
  runWithDataScope,
  type DataScopeContext,
} from "@/core/context/data-scope.js";
import { LRUCache } from "lru-cache";

export const SCOPE_CACHE_TTL = 60 * 5;

const lru = new LRUCache<string, DataScopeContext>({
  max: 5_000,
  ttl: 10_000,
});

export function toWhereScope(ctx: DataScopeContext): Record<string, any> {
  if (ctx.deptIds === "*") return {};
  if (ctx.selfOnly) return { created_by: ctx.userId };
  if (ctx.deptIds.length === 0) {
    return { id: { equals: "__never_match__" } };
  }
  return { sys_user_dept: { some: { dept_id: { in: ctx.deptIds } } } };
}

async function expandDeptTree(
  rootIds: string[],
  tenantId: string,
): Promise<string[]> {
  if (rootIds.length === 0) return [];
  const all = await prisma.sys_dept.findMany({
    where: { tenant_id: tenantId, is_deleted: 0 },
    select: { dept_id: true, parent_id: true },
  });
  const childrenMap = new Map<string, string[]>();
  for (const d of all) {
    if (!d.parent_id) continue;
    const list = childrenMap.get(d.parent_id) ?? [];
    list.push(d.dept_id);
    childrenMap.set(d.parent_id, list);
  }
  const result = new Set<string>(rootIds);
  const stack = [...rootIds];
  while (stack.length) {
    const cur = stack.pop()!;
    const children = childrenMap.get(cur) ?? [];
    for (const c of children) {
      if (!result.has(c)) {
        result.add(c);
        stack.push(c);
      }
    }
  }
  return [...result];
}

async function computeDataScopeInternal(
  userId: string,
  tenantId: string,
): Promise<DataScopeContext> {
  const userRoles = await prisma.sys_user_role.findMany({
    where: { user_id: userId, tenant_id: tenantId },
    include: { role: true },
  });

  const scopes = userRoles
    .map((ur: any) => ur.role?.data_scope)
    .filter(Boolean) as string[];

  if (scopes.length === 0) {
    return { userId, tenantId, deptIds: [], selfOnly: true };
  }
  if (scopes.includes("1")) {
    return { userId, tenantId, deptIds: "*", selfOnly: false };
  }

  const customDeptIds: string[] = [];
  let hasSelf = false;
  let hasDept = false;
  let hasDeptAndChildren = false;

  for (const ur of userRoles as any[]) {
    const code = ur.role?.data_scope;
    if (code === "2") {
      const rows = await prisma.sys_role_dept.findMany({
        where: { role_id: ur.role_id, tenant_id: tenantId },
        select: { dept_id: true },
      });
      customDeptIds.push(...rows.map((r) => r.dept_id));
    } else if (code === "3") hasDept = true;
    else if (code === "4") hasDeptAndChildren = true;
    else if (code === "5") hasSelf = true;
  }

  const userDepts = await prisma.sys_user_dept.findMany({
    where: { user_id: userId, tenant_id: tenantId },
    select: { dept_id: true },
  });
  const ownDeptIds = userDepts.map((d) => d.dept_id);

  const combined = new Set<string>(customDeptIds);
  if (hasDept) ownDeptIds.forEach((d) => combined.add(d));
  if (hasDeptAndChildren) {
    const expanded = await expandDeptTree(ownDeptIds, tenantId);
    expanded.forEach((d) => combined.add(d));
  }

  if (combined.size === 0 && hasSelf) {
    return { userId, tenantId, deptIds: [], selfOnly: true };
  }
  if (combined.size === 0) {
    return { userId, tenantId, deptIds: [], selfOnly: true };
  }

  return {
    userId,
    tenantId,
    deptIds: [...combined],
    selfOnly: false,
  };
}

export async function computeDataScope(
  userId: string,
  tenantId: string,
): Promise<DataScopeContext> {
  const lk = `${tenantId}:${userId}`;
  const hit = lru.get(lk);
  if (hit) return hit;

  const cacheKey = `rbac:${tenantId}:${userId}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as DataScopeContext;
      lru.set(lk, parsed);
      return parsed;
    }
  } catch {}

  const result = await computeDataScopeInternal(userId, tenantId);

  try {
    await redis.setex(cacheKey, SCOPE_CACHE_TTL, JSON.stringify(result));
  } catch {}
  lru.set(lk, result);
  return result;
}

export async function invalidateDataScopeCache(
  userId: string,
  tenantId: string,
): Promise<void> {
  try {
    await redis.del(`rbac:${tenantId}:${userId}`);
  } catch {}
  lru.delete(`${tenantId}:${userId}`);
}

/**
 * ⭐ fail-closed 中间件：计算失败抛错，不静默放行。
 * 把 ctx + whereScope 挂到 ALS，Repository 只从 ALS 读。
 */
export function dataScopeMiddleware() {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const user = (req as any).user;
    if (!user?.userId || !user?.tenantId) return next();

    let ctx: DataScopeContext;
    try {
      ctx = await computeDataScope(user.userId, user.tenantId);
    } catch (err) {
      logger.error({ err }, "computeDataScope failed");
      return next(new AppError("数据权限计算失败", 500001, 500));
    }

    const whereScope = toWhereScope(ctx);
    (req as any).dataScope = ctx;
    runWithDataScope(ctx, whereScope, () => next());
  };
}
