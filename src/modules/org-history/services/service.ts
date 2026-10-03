import { OrgHistoryRepository } from "../repository.js";
import { prisma } from "@/config/database.js";
import { revertHistory } from "../reverter.js";
import { NotFoundError } from "@/core/index.js";

export class OrgHistoryService {
  private repo = new OrgHistoryRepository();

  async list(params: Parameters<OrgHistoryRepository["findPage"]>[0]) {
    return this.repo.findPage(params);
  }

  /** 员工组织时间线 */
  async userTimeline(userId: string, tenantId: string, limit = 200) {
    const events = await this.repo.findUserTimeline(userId, tenantId, limit);

    // 补充当前部门信息（用于展示）
    const userDepts = await prisma.sys_user_dept.findMany({
      where: { user_id: userId, tenant_id: tenantId },
      include: { dept: { select: { dept_id: true, dept_name: true } } },
    });

    return {
      events: events.map((e) => ({
        historyId: e.history_id,
        entityType: e.entity_type,
        changeType: e.change_type,
        summary: e.summary,
        scope: e.scope,
        operatorName: e.operator_name,
        source: e.source ?? "",
        createdAt: e.created_at,
        before: e.before_data,
        after: e.after_data,
      })),
      currentDepts: userDepts.map((ud) => ({
        deptId: ud.dept_id,
        deptName: ud.dept.dept_name,
        isPrimary: ud.is_primary === 1,
      })),
    };
  }

  /** 部门变更时间线 */
  async deptTimeline(deptId: string, tenantId: string, limit = 200) {
    return this.repo.findDeptTimeline(deptId, tenantId, limit);
  }

  /** 某时间点的员工部门快照 */
  async userDeptAt(userId: string, tenantId: string, at: string) {
    return this.repo.findUserDeptAt(userId, tenantId, new Date(at));
  }

  /** 统计（用于大屏 / 报表） */
  async stats(tenantId: string, days = 30) {
    return this.repo.countByScope(tenantId, days);
  }

  /** 清理 */
  async cleanup(days = 365 * 5) {
    return this.repo.deleteOlderThan(days);
  }
  async revert(
    historyId: string,
    tenantId: string,
    operator: { userId: string; username: string },
    reason?: string,
  ) {
    return revertHistory(historyId, tenantId, operator, reason);
  }
  async detail(historyId: string, tenantId: string) {
    const event = await prisma.sys_org_history.findFirst({
      where: { history_id: historyId, tenant_id: tenantId },
    });
    if (!event) throw new NotFoundError("历史记录不存在");

    // 若已撤销，带上撤销记录
    const revertEvent = event.reverted_at
      ? await prisma.sys_org_history.findFirst({
          where: {
            tenant_id: tenantId,
            entity_type: event.entity_type,
            entity_id: event.entity_id,
            source: "system",
            created_at: { gte: event.reverted_at },
          },
          orderBy: { created_at: "asc" },
        })
      : null;

    return { event, revertEvent };
  }
}
