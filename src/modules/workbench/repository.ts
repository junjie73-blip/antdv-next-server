import { prisma } from "@/config/database.js";

export class WorkbenchRepository {
  async summary(userId: string, tenantId: string) {
    const now = new Date();

    const [
      userCount,
      roleCount,
      deptCount,
      noticeCount,
      unreadNotice,
      todoUncompleted,
      todoOverdue,
      urgentNoticeCount,
    ] = await Promise.all([
      prisma.sys_user.count({
        where: { tenant_id: tenantId, is_deleted: 0, status: "1" },
      }),
      prisma.sys_role.count({ where: { tenant_id: tenantId, is_deleted: 0 } }),
      prisma.sys_dept.count({ where: { tenant_id: tenantId, is_deleted: 0 } }),
      prisma.sys_notice.count({
        where: { tenant_id: tenantId, is_deleted: 0, status: "1" },
      }),
      // ⭐ 未读通知：只统计当前用户 + 已发布 + 未删除
      prisma.sys_notice_user.count({
        where: {
          tenant_id: tenantId,
          user_id: userId,
          is_read: 0,
          is_deleted: 0,
          notice: {
            is_deleted: 0,
            status: "1",
          },
        },
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
      // ⭐ 紧急通知：只统计当前用户的
      prisma.sys_notice_user.count({
        where: {
          tenant_id: tenantId,
          user_id: userId,
          is_deleted: 0,
          notice: {
            is_deleted: 0,
            status: "1",
            priority: { gte: 2 },
          },
        },
      }),
    ]);

    // 最近 7 天登录趋势（不变）
    const loginTrend = await prisma.$queryRaw<
      Array<{ date: Date; count: bigint }>
    >`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM sys_login_log
      WHERE tenant_id = ${tenantId} AND status = '1' AND created_at >= ${new Date(Date.now() - 7 * 86400000)}
      GROUP BY DATE(created_at) ORDER BY date ASC
    `;

    // 最近操作日志（不变）
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

    // ⭐ 重要通知列表：只查当前用户的
    const noticeListRaw = await prisma.sys_notice.findMany({
      where: {
        tenant_id: tenantId,
        is_deleted: 0,
        status: "1",
        target_users: {
          some: {
            tenant_id: tenantId,
            user_id: userId,
            is_deleted: 0,
          },
        },
      },
      select: {
        notice_id: true,
        title: true,
        notice_type: true,
        priority: true,
        is_top: true,
        publish_time: true,
        created_at: true,
        target_users: {
          where: {
            tenant_id: tenantId,
            user_id: userId,
            is_deleted: 0,
          },
          select: { is_read: true },
          take: 1,
        },
      },
      orderBy: [
        { is_top: "desc" },
        { priority: "desc" },
        { publish_time: "desc" },
      ],
      take: 5,
    });

    const notices = noticeListRaw.map((n) => ({
      noticeId: n.notice_id,
      title: n.title,
      noticeType: n.notice_type,
      priority: n.priority ?? 0,
      isTop: n.is_top ?? 0,
      publishTime: n.publish_time ?? n.created_at,
      isRead: (n.target_users[0]?.is_read === 1 ? 1 : 0) as 0 | 1,
    }));

    return {
      stats: {
        userCount,
        roleCount,
        deptCount,
        noticeCount,
        unreadNotice,
        todoUncompleted,
        todoOverdue,
        urgentNoticeCount,
      },
      loginTrend: loginTrend.map((r) => ({
        date: r.date,
        count: Number(r.count),
      })),
      recentLogs,
      notices,
    };
  }
}
