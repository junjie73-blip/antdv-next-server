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
/**
 * ✅ 需要跳过数据权限的路径
 * 分类：
 *  1. 平台级表（sys_tenant、sys_audit_log、sys_login_log 等无 dataScope 概念）
 *  2. 全局监控（KPI、QPS、缓存、DB）
 *  3. 系统选项/字典（无 created_by 概念）
 *  4. 认证/个人中心（当前用户强制 self）
 *  5. 文件/上传（按 URL 而非数据归属）
 *  6. 工作台（本身聚合）
 */
const SKIP_PATTERNS: RegExp[] = [
  // 平台级（无 dataScope 概念）
  /^\/api\/v1\/tenant(\/|$)/,
  /^\/api\/v1\/monitor(\/|$)/,
  /^\/api\/v1\/dashboard(\/|$)/,
  /^\/api\/v1\/workbench(\/|$)/,

  // 认证本身（当前用户自己的信息）
  /^\/api\/v1\/auth\/profile(\/|$)/,
  /^\/api\/v1\/auth\/menus(\/|$)/,
  /^\/api\/v1\/auth\/permissions(\/|$)/,
  /^\/api\/v1\/auth\/captcha(\/|$)/,
  /^\/api\/v1\/auth\/password-policy(\/|$)/,
  /^\/api\/v1\/auth\/my-devices(\/|$)/,
  /^\/api\/v1\/auth\/tenants(\/|$)/,
  /^\/api\/v1\/auth\/login(\/|$)/,
  /^\/api\/v1\/auth\/register(\/|$)/,
  /^\/api\/v1\/auth\/logout(\/|$)/,
  /^\/api\/v1\/auth\/refresh(\/|$)/,
  /^\/api\/v1\/auth\/switch-tenant(\/|$)/,

  // 全局配置（与数据无关）
  /^\/api\/v1\/settings(\/|$)/,
  /^\/api\/v1\/notice-channel(\/|$)/,

  // 字典（全局）
  /^\/api\/v1\/dict-type(\/|$)/,
  /^\/api\/v1\/dict-data\/by-code(\/|$)/,
  /^\/api\/v1\/dict-data\/code\/tree(\/|$)/,
];
function shouldSkipDataScope(path: string): boolean {
  return SKIP_PATTERNS.some((re) => re.test(path));
}

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
    const tenantId = (req as any).tenantId;

    // 未认证：仍然设置一个"空上下文"，让后续 Repository 能读到
    if (!user?.userId || !tenantId) {
      const emptyCtx: DataScopeContext = {
        userId: user?.userId ?? "",
        tenantId: tenantId ?? "",
        deptIds: "*", // 未认证场景一般走白名单，能到这里说明是公开接口
        selfOnly: false,
      };
      return runWithDataScope(emptyCtx, {}, () => next());
    }

    // ✅ SKIP 路径：设置"全部可见"上下文，避免 Repository 抛错
    if (shouldSkipDataScope(req.path)) {
      const looseCtx: DataScopeContext = {
        userId: user.userId,
        tenantId,
        deptIds: "*", // 平台级 / 全局配置：不做过滤
        selfOnly: false,
      };
      (req as any).dataScope = looseCtx;
      return runWithDataScope(looseCtx, {}, () => next());
    }

    // 业务路径：正常计算
    let ctx: DataScopeContext;
    try {
      ctx = await computeDataScope(user.userId, tenantId);
    } catch (err) {
      logger.error({ err, path: req.path }, "computeDataScope failed");
      return next(new AppError("数据权限计算失败", 500001, 500));
    }

    const whereScope = toWhereScope(ctx);
    (req as any).dataScope = ctx;
    runWithDataScope(ctx, whereScope, () => next());
  };
}
