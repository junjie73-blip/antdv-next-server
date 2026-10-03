import { AsyncLocalStorage } from "node:async_hooks";
import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";
import { getClientIp } from "@/shared/utils/ip.js";

/* ============================================================
 * 请求上下文：operator / ip / traceId 由中间件注入
 * ============================================================ */
export interface OrgHistoryContext {
  tenantId: string;
  operatorId?: string;
  operatorName?: string;
  ipAddress?: string;
  traceId?: string;
  source?: "app" | "api" | "import" | "system";
}

export const orgHistoryStorage = new AsyncLocalStorage<OrgHistoryContext>();

/* ============================================================
 * 变更记录输入
 * ============================================================ */
export interface OrgChangeInput {
  entityType: "dept" | "user" | "user_dept" | "user_role";
  entityId: string;
  changeType:
    | "create"
    | "update"
    | "delete"
    | "move"
    | "transfer"
    | "assign"
    | "revoke";
  scope: "dept_tree" | "user_profile" | "user_dept" | "user_role" | "position";
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  summary?: string;
  relatedId?: string;
  reversible?: boolean;
}

/* ============================================================
 * 核心：批量写入
 * ============================================================ */
export async function recordOrgHistory(
  changes: OrgChangeInput[],
  overrideCtx?: Partial<OrgHistoryContext>,
): Promise<void> {
  if (changes.length === 0) return;

  const ctx = { ...orgHistoryStorage.getStore(), ...overrideCtx };
  if (!ctx.tenantId) {
    logger.warn({ changes }, "[org-history] missing tenantId, skip");
    return;
  }

  try {
    await prisma.sys_org_history.createMany({
      data: changes.map((c) => ({
        tenant_id: ctx.tenantId!,
        entity_type: c.entityType,
        entity_id: c.entityId,
        change_type: c.changeType,
        scope: c.scope,
        before_data: (c.before ?? null) as any,
        after_data: (c.after ?? null) as any,
        summary: c.summary?.slice(0, 512),
        source: ctx.source ?? "app",
        operator_id: ctx.operatorId,
        operator_name: ctx.operatorName,
        ip_address: ctx.ipAddress,
        trace_id: ctx.traceId,
        related_id: c.relatedId,
        reversible: c.reversible === false ? 0 : 1,
      })),
    });
  } catch (err) {
    // 历史记录失败不能影响业务主流程
    logger.error({ err, count: changes.length }, "[org-history] write failed");
  }
}

/** 事务版本：与业务在同一 tx 中写入，保证原子性 */
export async function recordOrgHistoryInTx(
  tx: any,
  changes: OrgChangeInput[],
  overrideCtx?: Partial<OrgHistoryContext>,
): Promise<void> {
  if (changes.length === 0) return;
  const ctx = { ...orgHistoryStorage.getStore(), ...overrideCtx };
  if (!ctx.tenantId) return;

  await tx.sys_org_history.createMany({
    data: changes.map((c) => ({
      tenant_id: ctx.tenantId!,
      entity_type: c.entityType,
      entity_id: c.entityId,
      change_type: c.changeType,
      scope: c.scope,
      before_data: (c.before ?? null) as any,
      after_data: (c.after ?? null) as any,
      summary: c.summary?.slice(0, 512),
      source: ctx.source ?? "app",
      operator_id: ctx.operatorId,
      operator_name: ctx.operatorName,
      ip_address: ctx.ipAddress,
      trace_id: ctx.traceId,
      related_id: c.relatedId,
      reversible: c.reversible === false ? 0 : 1,
    })),
  });
}
