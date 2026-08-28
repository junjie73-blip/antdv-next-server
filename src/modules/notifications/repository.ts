import { BaseRepository } from "@common/core/base-repository.js";
import { prisma } from "@/config/database.js";

export class NotificationRepository extends BaseRepository<any> {
  constructor() {
    super(prisma.notification);
  }

  async findByUser(
    userId: string,
    tenantId: string,
    options: { isRead?: boolean; page?: number; limit?: number } = {},
  ) {
    const { isRead, page = 1, limit = 20 } = options;

    const where: any = {
      tenantId,
      deletedAt: null,
      status: "ACTIVE",
      OR: [
        { targetType: "ALL" },
        { targetType: "USER", targetUsers: { contains: userId } },
      ],
    };

    // 如果是按角色推送，需要额外查询用户角色匹配
    // 简化处理：先查用户角色，再查通知
    if (isRead !== undefined) {
      // 个人已读状态通过 UserNotification 关联查询
    }

    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          userNotifications: {
            where: { userId },
            select: { isRead: true, readAt: true },
          },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    // 标记已读状态
    const enriched = data.map((n: any) => ({
      ...n,
      isRead: n.userNotifications?.[0]?.isRead || false,
      readAt: n.userNotifications?.[0]?.readAt || null,
      userNotifications: undefined,
    }));

    return { data: enriched, total, page, limit };
  }

  async getUnreadCount(userId: string, tenantId: string) {
    const userRoles = await prisma.userRole.findMany({
      where: { userId, tenantId },
      select: { roleId: true },
    });
    const roleIds = userRoles.map((ur: any) => ur.roleId);

    const where: any = {
      tenantId,
      deletedAt: null,
      status: "ACTIVE",
      OR: [
        { targetType: "ALL" },
        { targetType: "USER", targetUsers: { contains: userId } },
        {
          targetType: "ROLE",
          targetRoles: { in: roleIds.map((id: string) => ({ contains: id })) },
        },
      ],
    };

    const total = await prisma.notification.count({ where });

    const readCount = await prisma.userNotification.count({
      where: { userId, tenantId, isRead: true },
    });

    return Math.max(0, total - readCount);
  }

  async markAsRead(userId: string, notificationId: string, tenantId: string) {
    return prisma.userNotification.upsert({
      where: {
        userId_notificationId: { userId, notificationId },
      },
      update: { isRead: true, readAt: new Date() },
      create: {
        userId,
        notificationId,
        tenantId,
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string, tenantId: string) {
    const notifications = await prisma.notification.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: "ACTIVE",
        OR: [
          { targetType: "ALL" },
          { targetType: "USER", targetUsers: { contains: userId } },
        ],
      },
      select: { id: true },
    });

    const data = notifications.map((n: any) => ({
      userId,
      notificationId: n.id,
      tenantId,
      isRead: true,
      readAt: new Date(),
    }));

    // 批量 upsert（Prisma 不支持批量 upsert，逐条处理或忽略冲突）
    await Promise.all(
      data.map((d: any) =>
        prisma.userNotification.upsert({
          where: {
            userId_notificationId: {
              userId: d.userId,
              notificationId: d.notificationId,
            },
          },
          update: { isRead: true, readAt: new Date() },
          create: d,
        }),
      ),
    );
  }
}
