import { prisma } from "@/config/database.js";

export class WorkbenchRepository {
  async summary(userId: string, tenantId: string) {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const [
      userCount,
      roleCount,
      deptCount,
      noticeCount,
      unreadNotice,
      todoUncompleted,
      todoOverdue,
    ] = await Promise.all([
      prisma.sys_user.count({
        where: { tenant_id: tenantId, is_deleted: 0, status: "1" },
      }),
      prisma.sys_role.count({ where: { tenant_id: tenantId, is_deleted: 0 } }),
      prisma.sys_dept.count({ where: { tenant_id: tenantId, is_deleted: 0 } }),
      prisma.sys_notice.count({
        where: { tenant_id: tenantId, is_deleted: 0, status: "1" },
      }),
      prisma.sys_notice_user.count({
        where: { tenant_id: tenantId, user_id: userId, is_read: 0 },
      }),
      prisma.sys_todo.count({
        where: {
          tenant_id: tenantId,
          user_id: userId,
          status: "0",
          is_deleted: 0,
        },
      }),
      prisma.sys_todo.count({
        where: {
          tenant_id: tenantId,
          user_id: userId,
          status: "0",
          is_deleted: 0,
          due_time: { lt: now },
        },
      }),
    ]);

    // 最近 7 天登录趋势
    const loginTrend = await prisma.$queryRaw<
      Array<{ date: Date; count: bigint }>
    >`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM sys_login_log
      WHERE tenant_id = ${tenantId} AND status = '1' AND created_at >= ${new Date(Date.now() - 7 * 86400000)}
      GROUP BY DATE(created_at) ORDER BY date ASC
    `;

    // 最近操作日志
    const recentLogs = await prisma.sys_audit_log.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: "desc" },
      select: {
        log_id: true,
        username: true,
        operation: true,
        created_at: true,
        status: true,
      },
    });

    return {
      stats: {
        userCount,
        roleCount,
        deptCount,
        noticeCount,
        unreadNotice,
        todoUncompleted,
        todoOverdue,
      },
      loginTrend: loginTrend.map((r) => ({
        date: r.date,
        count: Number(r.count),
      })),
      recentLogs,
    };
  }
}
