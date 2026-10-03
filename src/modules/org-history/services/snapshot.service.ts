// src/modules/system/org-history/snapshot.service.ts
import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";

export class OrgSnapshotService {
  /**
   * 为指定租户生成快照。
   * 幂等：同一天同一类型重复执行会覆盖。
   */
  async generateForTenant(tenantId: string, date = new Date()): Promise<void> {
    const snapshotDate = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );

    // 1. 部门树
    const depts = await prisma.sys_dept.findMany({
      where: { tenant_id: tenantId, is_deleted: 0 },
      select: {
        dept_id: true,
        parent_id: true,
        dept_name: true,
        leader_id: true,
        status: true,
      },
    });

    // 2. 用户-部门映射
    const userDepts = await prisma.sys_user_dept.findMany({
      where: { tenant_id: tenantId },
      select: { user_id: true, dept_id: true, is_primary: true },
    });

    // 3. 用户-角色映射
    const userRoles = await prisma.sys_user_role.findMany({
      where: { tenant_id: tenantId },
      select: { user_id: true, role_id: true },
    });

    // 4. 用户基础信息
    const users = await prisma.sys_user.findMany({
      where: { tenant_id: tenantId, is_deleted: 0 },
      select: { user_id: true, username: true, real_name: true, status: true },
    });

    const data = { depts, userDepts, userRoles, users };

    await prisma.sys_org_snapshot.upsert({
      where: {
        tenant_id_snapshot_date_snapshot_type: {
          tenant_id: tenantId,
          snapshot_date: snapshotDate,
          snapshot_type: "full",
        },
      },
      update: {
        data: data as any,
        user_count: users.length,
        dept_count: depts.length,
      },
      create: {
        tenant_id: tenantId,
        snapshot_date: snapshotDate,
        snapshot_type: "full",
        data: data as any,
        user_count: users.length,
        dept_count: depts.length,
      },
    });

    logger.info(
      {
        tenantId,
        date: snapshotDate.toISOString().slice(0, 10),
        users: users.length,
        depts: depts.length,
      },
      "[org-snapshot] generated",
    );
  }

  /** 全租户批量生成 */
  async generateAll(date = new Date()): Promise<number> {
    const tenants = await prisma.sys_tenant.findMany({
      where: { status: "1", is_deleted: 0 },
      select: { tenant_id: true },
    });
    let count = 0;
    for (const t of tenants) {
      try {
        await this.generateForTenant(t.tenant_id, date);
        count++;
      } catch (err) {
        logger.error({ err, tenantId: t.tenant_id }, "[org-snapshot] failed");
      }
    }
    return count;
  }

  /**
   * 回溯：查询某时间点的组织快照。
   * 若当天没有，向前找最近的。
   */
  async getAt(tenantId: string, at: Date, type: "full" = "full") {
    return prisma.sys_org_snapshot.findFirst({
      where: {
        tenant_id: tenantId,
        snapshot_type: type,
        snapshot_date: { lte: at },
      },
      orderBy: { snapshot_date: "desc" },
    });
  }

  /** 列出快照 */
  async list(tenantId: string, limit = 24) {
    return prisma.sys_org_snapshot.findMany({
      where: { tenant_id: tenantId },
      orderBy: { snapshot_date: "desc" },
      take: limit,
      select: {
        snapshot_id: true,
        snapshot_date: true,
        snapshot_type: true,
        user_count: true,
        dept_count: true,
        created_at: true,
      },
    });
  }

  /** 清理超过 N 天的快照 */
  async cleanup(days = 365 * 3): Promise<number> {
    const before = new Date(Date.now() - days * 86_400_000);
    const r = await prisma.sys_org_snapshot.deleteMany({
      where: { snapshot_date: { lt: before } },
    });
    return r.count;
  }
}
