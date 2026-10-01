import { prisma } from "@/config/database.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { ExpressionEvaluator } from "./expression-evaluator.js";
import type { AssigneeConfig } from "../types.js";

export interface ResolveContext {
  tenantId: string;
  instanceId?: string;
  initiatorId: string;
  initiatorDeptId?: string | null;
  variables: Record<string, any>;
}

const MAX_ASSIGNEES = 200;

export class AssigneeResolver {
  /**
   * 解析审批人
   */
  static async resolve(
    config: AssigneeConfig,
    ctx: ResolveContext,
  ): Promise<string[]> {
    if (!config || !config.type) {
      throw new AppError("审批人配置无效", 400001, 400);
    }

    let userIds: string[] = [];

    switch (config.type) {
      case "user":
        userIds = this.resolveStaticUser(config.value);
        break;
      case "initiator":
        userIds = [ctx.initiatorId];
        break;
      case "role":
        userIds = await this.resolveByRole(config.value!, ctx.tenantId);
        break;
      case "dept":
        userIds = await this.resolveByDept(config.value!, ctx.tenantId);
        break;
      case "deptLeader":
        userIds = await this.resolveByDeptLeader(
          ctx.initiatorId,
          ctx.tenantId,
          config.level ?? 1,
        );
        break;
      case "expression":
        userIds = await this.resolveByExpression(config.expression!, ctx);
        break;
      default:
        throw new AppError(`不支持的审批人类型：${config.type}`, 400001, 400);
    }

    userIds = [...new Set(userIds.filter(Boolean))];

    if (userIds.length > MAX_ASSIGNEES) {
      logger.warn(
        { count: userIds.length, type: config.type },
        "[assignee] 审批人数量过多，已截断",
      );
      userIds = userIds.slice(0, MAX_ASSIGNEES);
    }

    return userIds;
  }

  private static resolveStaticUser(value?: string): string[] {
    if (!value) return [];
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private static async resolveByRole(
    roleCode: string,
    tenantId: string,
  ): Promise<string[]> {
    if (!roleCode) return [];
    const rows = await prisma.sys_user_role.findMany({
      where: {
        tenant_id: tenantId,
        role: { role_code: roleCode, is_deleted: 0 },
        user: { is_deleted: 0, status: "1" },
      },
      select: { user_id: true },
    });
    return rows.map((r) => r.user_id);
  }

  private static async resolveByDept(
    deptIds: string,
    tenantId: string,
  ): Promise<string[]> {
    if (!deptIds) return [];
    const ids = deptIds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) return [];

    const rows = await prisma.sys_user_dept.findMany({
      where: {
        tenant_id: tenantId,
        dept_id: { in: ids },
        user: { is_deleted: 0, status: "1" },
      },
      select: { user_id: true },
    });
    return rows.map((r) => r.user_id);
  }

  private static async resolveByDeptLeader(
    userId: string,
    tenantId: string,
    level: number,
  ): Promise<string[]> {
    if (level < 1 || level > 10) return [];

    const userDept = await prisma.sys_user_dept.findFirst({
      where: { user_id: userId, tenant_id: tenantId, is_primary: 1 },
      select: { dept_id: true },
    });
    if (!userDept) return [];

    let currentDeptId: string | null = userDept.dept_id;
    let depth = 0;
    let targetDeptId: string | null = null;

    while (currentDeptId && depth < 20) {
      const dept = await prisma.sys_dept.findFirst({
        where: { dept_id: currentDeptId, tenant_id: tenantId, is_deleted: 0 },
        select: { parent_id: true, leader_id: true },
      });
      if (!dept) break;

      depth++;
      if (depth === level) {
        targetDeptId = currentDeptId;
        break;
      }
      if (!dept.parent_id) {
        targetDeptId = currentDeptId;
        break;
      }
      currentDeptId = dept.parent_id;
    }

    if (!targetDeptId) return [];

    const target = await prisma.sys_dept.findFirst({
      where: { dept_id: targetDeptId, tenant_id: tenantId, is_deleted: 0 },
      select: { leader_id: true },
    });
    return target?.leader_id ? [target.leader_id] : [];
  }

  private static async resolveByExpression(
    expression: string,
    ctx: ResolveContext,
  ): Promise<string[]> {
    if (!expression) return [];
    try {
      const result = ExpressionEvaluator.evaluate(expression, {
        variables: ctx.variables,
        initiatorId: ctx.initiatorId,
        initiatorDeptId: ctx.initiatorDeptId ?? null,
        tenantId: ctx.tenantId,
      });
      if (!result) return [];
      if (Array.isArray(result))
        return result.filter((v) => typeof v === "string");
      if (typeof result === "string") {
        return result
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return [];
    } catch (err: any) {
      logger.warn(
        { err: err.message, expression },
        "[assignee] 表达式解析失败",
      );
      return [];
    }
  }
}
