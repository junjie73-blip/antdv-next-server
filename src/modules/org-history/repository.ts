import { prisma } from "@/config/database.js";
import { Prisma } from "@/generated/prisma/client.js";
import { rawGroupBy, toSafeNumber } from "@/shared/utils/rawGroupBy.js";

export class OrgHistoryRepository {
  async findPage(params: {
    tenantId: string;
    entityType?: string;
    entityId?: string;
    scope?: string;
    changeType?: string;
    operatorId?: string;
    startTime?: Date;
    endTime?: Date;
    pageNum: number;
    pageSize: number;
  }) {
    const where: any = { tenant_id: params.tenantId };
    if (params.entityType) where.entity_type = params.entityType;
    if (params.entityId) where.entity_id = params.entityId;
    if (params.scope) where.scope = params.scope;
    if (params.changeType) where.change_type = params.changeType;
    if (params.operatorId) where.operator_id = params.operatorId;
    if (params.startTime || params.endTime) {
      where.created_at = {};
      if (params.startTime) where.created_at.gte = params.startTime;
      if (params.endTime) where.created_at.lte = params.endTime;
    }

    const [list, total] = await Promise.all([
      prisma.sys_org_history.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (params.pageNum - 1) * params.pageSize,
        take: params.pageSize,
      }),
      prisma.sys_org_history.count({ where }),
    ]);
    return { list, total };
  }

  /** 某员工的完整组织时间线 */
  async findUserTimeline(userId: string, tenantId: string, limit = 200) {
    return prisma.sys_org_history.findMany({
      where: {
        tenant_id: tenantId,
        entity_id: userId,
        entity_type: { in: ["user", "user_dept", "user_role"] },
      },
      orderBy: { created_at: "desc" },
      take: limit,
    });
  }

  /** 某部门的所有变更 */
  async findDeptTimeline(deptId: string, tenantId: string, limit = 200) {
    return prisma.sys_org_history.findMany({
      where: {
        tenant_id: tenantId,
        OR: [
          { entity_type: "dept", entity_id: deptId },
          { entity_type: "user_dept", related_id: deptId },
        ],
      },
      orderBy: { created_at: "desc" },
      take: limit,
    });
  }

  /**
   * 回溯查询：某员工在某时间点的所属部门
   */
  async findUserDeptAt(
    userId: string,
    tenantId: string,
    at: Date,
  ): Promise<string[]> {
    // 1. 先找最近的快照
    const snapshot = await prisma.sys_org_snapshot.findFirst({
      where: {
        tenant_id: tenantId,
        snapshot_type: "full",
        snapshot_date: { lte: at },
      },
      orderBy: { snapshot_date: "desc" },
    });

    const depts = new Set<string>();

    if (snapshot) {
      const data = snapshot.data as any;
      for (const ud of data.userDepts ?? []) {
        if (ud.user_id === userId) depts.add(ud.dept_id);
      }

      // 2. 快照之后到 at 之间的增量变更再 apply
      const events = await prisma.sys_org_history.findMany({
        where: {
          tenant_id: tenantId,
          entity_type: "user_dept",
          entity_id: userId,
          created_at: { gt: snapshot.created_at, lte: at },
        },
        orderBy: { created_at: "asc" },
      });
      for (const e of events) {
        const a = e.after_data as any;
        const b = e.before_data as any;
        if (e.change_type === "assign" && a?.dept_id) depts.add(a.dept_id);
        if (e.change_type === "revoke" && b?.dept_id) depts.delete(b.dept_id);
      }
    } else {
      // 3. 无快照：全量 replay（原逻辑）
      const events = await prisma.sys_org_history.findMany({
        where: {
          tenant_id: tenantId,
          entity_type: "user_dept",
          entity_id: userId,
          created_at: { lte: at },
        },
        orderBy: { created_at: "asc" },
      });
      for (const e of events) {
        const a = e.after_data as any;
        const b = e.before_data as any;
        if (e.change_type === "assign" && a?.dept_id) depts.add(a.dept_id);
        if (e.change_type === "revoke" && b?.dept_id) depts.delete(b.dept_id);
      }
    }

    return [...depts];
  }

  /** 删除超过 N 天的历史（清理用） */
  async deleteOlderThan(days: number): Promise<number> {
    const before = new Date(Date.now() - days * 86_400_000);
    const result = await prisma.sys_org_history.deleteMany({
      where: { created_at: { lt: before } },
    });
    return result.count;
  }

  async countByScope(tenantId: string, days = 30) {
    const since = new Date(Date.now() - days * 86_400_000);
    const rows = await rawGroupBy<{ scope: string | null; count: bigint }>(
      "sys_org_history",
      {
        by: ["scope"],
        where: Prisma.sql`tenant_id = ${tenantId}::uuid AND created_at >= ${since}`,
        aggregate: { count: Prisma.sql`COUNT(*)::bigint` },
        orderBy: [{ field: "count", direction: "DESC" }],
      },
    );
    return rows.map((r) => ({ scope: r.scope, count: toSafeNumber(r.count) }));
  }
}
