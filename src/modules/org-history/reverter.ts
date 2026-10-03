import { prisma } from "@/config/database.js";
import { AppError, NotFoundError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { recordOrgHistoryInTx, type OrgChangeInput } from "./recorder.js";

const REVERT_WINDOW_DAYS = 30;

/**
 * 撤销一条历史记录。
 * 使用事务保证原子性；撤销动作本身也会写入一条新的 history。
 */
export async function revertHistory(
  historyId: string,
  tenantId: string,
  operator: { userId: string; username: string },
  reason?: string,
) {
  const event = await prisma.sys_org_history.findFirst({
    where: { history_id: historyId, tenant_id: tenantId },
  });
  if (!event) throw new NotFoundError("历史记录不存在");
  if (event.reverted_at) throw new AppError("该变更已被撤销", 400001, 400);
  if (event.reversible !== 1) throw new AppError("该变更不可撤销", 400001, 400);

  const ageDays = (Date.now() - event.created_at.getTime()) / 86_400_000;
  if (ageDays > REVERT_WINDOW_DAYS) {
    throw new AppError(
      `只能撤销 ${REVERT_WINDOW_DAYS} 天内的变更`,
      400001,
      400,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const reverseChanges: OrgChangeInput[] = [];
    await applyReverse(tx, event, reverseChanges, tenantId);

    // 写撤销产生的反向历史
    await recordOrgHistoryInTx(
      tx,
      reverseChanges.map((c) => ({
        ...c,
        summary: `[撤销] ${c.summary ?? ""}`,
      })),
      { tenantId, source: "system" },
    );
    const reverseHistoryIds = await tx.sys_org_history.findMany({
      where: {
        tenant_id: tenantId,
        source: "system",
        created_at: { gte: new Date(Date.now() - 5_000) },
        summary: { startsWith: "[撤销]" },
      },
      orderBy: { created_at: "desc" },
      take: 10,
      select: { history_id: true },
    });

    // 标记原记录
    await tx.sys_org_history.update({
      where: { history_id: historyId },
      data: {
        reverted_at: new Date(),
        reverted_by: operator.userId,
        revert_reason: reason?.slice(0, 512),
        reverted_by_history_id: reverseHistoryIds[0]?.history_id ?? null,
      },
    });

    // 反向历史记录里也写上 reverts_history_id
    for (const r of reverseHistoryIds) {
      await tx.sys_org_history.update({
        where: { history_id: r.history_id },
        data: { reverts_history_id: historyId },
      });
    }
    // 标记原记录为已撤销
    const updated = await tx.sys_org_history.update({
      where: { history_id: historyId },
      data: {
        reverted_at: new Date(),
        reverted_by: operator.userId,
        revert_reason: reason?.slice(0, 512),
      },
    });

    return updated;
  });

  logger.info(
    { historyId, tenantId, operatorId: operator.userId },
    "[org-history] reverted",
  );
  return result;
}

/* ============================================================
 * 反向执行：按 entity_type / change_type 分派
 * ============================================================ */
async function applyReverse(
  tx: any,
  event: any,
  out: OrgChangeInput[],
  tenantId: string,
): Promise<void> {
  const before = (event.before_data ?? {}) as Record<string, any>;
  const after = (event.after_data ?? {}) as Record<string, any>;
  const entityId = event.entity_id as string;

  switch (event.entity_type) {
    case "dept": {
      if (event.change_type === "create") {
        // 撤销创建 → 软删除部门（先检查无子部门/无用户）
        const children = await tx.sys_dept.count({
          where: { parent_id: entityId, tenant_id: tenantId, is_deleted: 0 },
        });
        if (children > 0)
          throw new AppError("部门下仍有子部门，无法撤销", 400001, 400);
        const users = await tx.sys_user_dept.count({
          where: { dept_id: entityId, tenant_id: tenantId },
        });
        if (users > 0)
          throw new AppError("部门下仍有用户，无法撤销", 400001, 400);
        await tx.sys_dept.update({
          where: { dept_id: entityId },
          data: { is_deleted: 1, updated_at: new Date() },
        });
        out.push({
          entityType: "dept",
          entityId,
          changeType: "delete",
          scope: "dept_tree",
          summary: `撤销创建部门「${before.dept_name}」`,
        });
      } else if (
        event.change_type === "update" ||
        event.change_type === "move"
      ) {
        await tx.sys_dept.update({
          where: { dept_id: entityId },
          data: {
            parent_id: before.parent_id ?? null,
            dept_name: before.dept_name,
            leader_id: before.leader_id ?? null,
            status: before.status,
            updated_at: new Date(),
          },
        });
        out.push({
          entityType: "dept",
          entityId,
          changeType: "update",
          scope: "dept_tree",
          before: after,
          after: before,
          summary: `撤销部门「${before.dept_name}」的更新`,
        });
      } else {
        throw new AppError(
          `不支持的部门变更类型：${event.change_type}`,
          400001,
          400,
        );
      }
      break;
    }

    case "user_dept": {
      const deptId = after.dept_id ?? before.dept_id;
      if (event.change_type === "assign") {
        await tx.sys_user_dept.deleteMany({
          where: { user_id: entityId, dept_id: deptId, tenant_id: tenantId },
        });
        out.push({
          entityType: "user_dept",
          entityId,
          changeType: "revoke",
          scope: "user_dept",
          relatedId: deptId,
          before: after,
          summary: `撤销加入部门`,
        });
      } else if (event.change_type === "revoke") {
        await tx.sys_user_dept.create({
          data: {
            user_id: entityId,
            dept_id: deptId,
            tenant_id: tenantId,
            is_primary: before.is_primary ?? 0,
          },
        });
        out.push({
          entityType: "user_dept",
          entityId,
          changeType: "assign",
          scope: "user_dept",
          relatedId: deptId,
          after: before,
          summary: `撤销移出部门`,
        });
      } else {
        throw new AppError(
          `不支持的部门关系变更：${event.change_type}`,
          400001,
          400,
        );
      }
      break;
    }

    case "user_role": {
      const roleId = after.role_id ?? before.role_id;
      if (event.change_type === "assign") {
        await tx.sys_user_role.deleteMany({
          where: { user_id: entityId, role_id: roleId, tenant_id: tenantId },
        });
        out.push({
          entityType: "user_role",
          entityId,
          changeType: "revoke",
          scope: "user_role",
          relatedId: roleId,
          before: after,
          summary: `撤销分配角色`,
        });
      } else if (event.change_type === "revoke") {
        await tx.sys_user_role.create({
          data: { user_id: entityId, role_id: roleId, tenant_id: tenantId },
        });
        out.push({
          entityType: "user_role",
          entityId,
          changeType: "assign",
          scope: "user_role",
          relatedId: roleId,
          after: before,
          summary: `撤销移除角色`,
        });
      }
      break;
    }

    case "user": {
      if (event.change_type === "update") {
        // 只回滚非敏感字段
        const FIELDS = [
          "real_name",
          "email",
          "phone",
          "avatar",
          "gender",
          "status",
        ];
        const patch: Record<string, any> = {};
        for (const f of FIELDS) if (f in before) patch[f] = before[f];
        if (Object.keys(patch).length === 0) {
          throw new AppError("无可回滚字段", 400001, 400);
        }
        await tx.sys_user.update({
          where: { user_id: entityId },
          data: { ...patch, updated_at: new Date() },
        });
        out.push({
          entityType: "user",
          entityId,
          changeType: "update",
          scope: "user_profile",
          before: after,
          after: patch,
          summary: `撤销用户信息变更`,
        });
      }
      break;
    }

    default:
      throw new AppError(`不支持的实体类型：${event.entity_type}`, 400001, 400);
  }
}
