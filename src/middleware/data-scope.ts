import { prisma } from "@/config/database.js";
import type { NextFunction, Request, Response } from "express";
import { logger } from "@/core/logger/index.js";

/**
 * 数据权限上下文
 * - deptIds === "*" 表示全部
 * - selfOnly = true 表示仅本人
 */
export interface DataScopeContext {
  userId: string;
  tenantId: string;
  deptIds: string[] | "*";
  selfOnly: boolean;
}

/**
 * 把 DataScopeContext 转换为 Prisma where 片段
 * 供 Repository 的 mergeDataScope 使用
 */
export function toWhereScope(ctx: DataScopeContext): Record<string, any> {
  if (ctx.deptIds === "*") return {}; // 全部数据，不加限制
  if (ctx.selfOnly) return { created_by: ctx.userId };
  return {
    sys_user_dept: {
      some: { dept_id: { in: ctx.deptIds } },
    },
  };
}

/**
 * 递归展开部门树，得到自身及全部子部门 ID
 */
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

/**
 * 计算用户的数据范围
 * 规则：以最宽松的为准
 *   1-全部        → deptIds = "*"
 *   2-自定义       → 查 sys_role_dept
 *   3-本部门       → 用户所有部门
 *   4-本部门及以下  → 用户所有部门 + 子部门
 *   5-仅本人       → selfOnly = true
 */
export async function computeDataScope(
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

  // 无角色 → 仅本人
  if (scopes.length === 0) {
    return { userId, tenantId, deptIds: [], selfOnly: true };
  }
  // 全部
  if (scopes.includes("1")) {
    return { userId, tenantId, deptIds: "*", selfOnly: false };
  }

  // 收集各种范围
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
    } else if (code === "3") {
      hasDept = true;
    } else if (code === "4") {
      hasDeptAndChildren = true;
    } else if (code === "5") {
      hasSelf = true;
    }
  }

  // 收集用户自己的部门
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

  // 只有"仅本人"范围
  if (combined.size === 0 && hasSelf) {
    return { userId, tenantId, deptIds: [], selfOnly: true };
  }
  // 完全没有任何可见部门（兜底：仅本人）
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

/**
 * Express 中间件：把 DataScopeContext + where 片段挂到 req
 * - req.dataScope       → DataScopeContext（供业务读取）
 * - req.dataScopeWhere  → Prisma where 片段（供 Repository 使用）
 *
 * 必须在 authMiddleware 之后使用。
 */
export function dataScopeMiddleware() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user?.userId || !user?.tenantId) return next();
      const ctx = await computeDataScope(user.userId, user.tenantId);
      (req as any).dataScope = ctx;
      (req as any).dataScopeWhere = toWhereScope(ctx);
    } catch (err) {
      // 计算失败不阻塞请求，但记录日志
      logger.error({ err }, "computeDataScope failed");
      (req as any).dataScopeWhere = {};
    }
    next();
  };
}
