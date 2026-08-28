import {
  Controller,
  Get,
  Tag,
  Summary,
  Query,
  Response as ApiResponse,
  RequirePermission,
  Middleware,
} from "@common/core/decorators.js";
import { z } from "zod";
import { prisma } from "@config/database.js";
import { authMiddleware } from "@common/middleware/auth.js";

@Controller("/dashboard")
export default class DashboardController {
  // ========== 仪表盘核心数据 ==========
  @Tag("仪表盘")
  @Summary("获取仪表盘统计数据")
  @Middleware(authMiddleware)
  @RequirePermission("user:read")
  @Query(z.object({ tenantId: z.string() }))
  @ApiResponse(
    200,
    z.object({
      success: z.boolean(),
      data: z.object({
        users: z.object({
          total: z.number(),
          active: z.number(),
          newToday: z.number(),
        }),
        roles: z.object({ total: z.number() }),
        permissions: z.object({ total: z.number() }),
        menus: z.object({ total: z.number() }),
        notifications: z.object({ unread: z.number(), total: z.number() }),
        files: z.object({ total: z.number(), totalSize: z.number() }),
        logs: z.object({ todayAudit: z.number() }),
      }),
    }),
    "查询成功",
  )
  @Get("/stats")
  async stats(req: any, res: any) {
    const { tenantId } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      userTotal,
      userActive,
      userNewToday,
      roleTotal,
      permissionTotal,
      menuTotal,
      notificationUnread,
      notificationTotal,
      fileTotal,
      fileSize,
      todayAudit,
    ] = await Promise.all([
      prisma.user.count({ where: { tenantId, deletedAt: null } }),
      prisma.user.count({
        where: { tenantId, deletedAt: null, status: "ACTIVE" },
      }),
      prisma.user.count({
        where: { tenantId, deletedAt: null, createdAt: { gte: today } },
      }),
      prisma.role.count({ where: { tenantId, deletedAt: null } }),
      prisma.permission.count({ where: { tenantId, deletedAt: null } }),
      prisma.menu.count({ where: { tenantId, deletedAt: null } }),
      prisma.userNotification.count({
        where: { tenantId, isRead: false },
      }),
      prisma.notification.count({ where: { tenantId, deletedAt: null } }),
      prisma.fileUpload.count({ where: { tenantId } }),
      prisma.fileUpload.aggregate({
        where: { tenantId, status: "COMPLETED" },
        _sum: { size: true },
      }),
      prisma.auditLog.count({
        where: { tenantId, createdAt: { gte: today } },
      }),
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: userTotal,
          active: userActive,
          newToday: userNewToday,
        },
        roles: { total: roleTotal },
        permissions: { total: permissionTotal },
        menus: { total: menuTotal },
        notifications: {
          unread: notificationUnread,
          total: notificationTotal,
        },
        files: {
          total: fileTotal,
          totalSize: fileSize._sum.size || 0,
        },
        logs: { todayAudit },
      },
    });
  }

  // ========== 用户增长趋势 ==========
  @Tag("仪表盘")
  @Summary("用户增长趋势（近30天）")
  @Middleware(authMiddleware)
  @RequirePermission("user:read")
  @Query(z.object({ tenantId: z.string(), days: z.string().optional() }))
  @ApiResponse(
    200,
    z.object({
      success: z.boolean(),
      data: z.array(z.object({ date: z.string(), count: z.number() })),
    }),
    "查询成功",
  )
  @Get("/user-trend")
  async userTrend(req: any, res: any) {
    const { tenantId, days = "30" } = req.query;
    const dayCount = Number(days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dayCount);

    const result = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE tenant_id = ${tenantId}
        AND deleted_at IS NULL
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    res.json({ success: true, data: result });
  }

  // ========== 最近操作记录 ==========
  @Tag("仪表盘")
  @Summary("最近操作记录（Top 10）")
  @Middleware(authMiddleware)
  @RequirePermission("user:read")
  @Query(z.object({ tenantId: z.string() }))
  @ApiResponse(
    200,
    z.object({
      success: z.boolean(),
      data: z.array(z.unknown()),
    }),
    "查询成功",
  )
  @Get("/recent-activities")
  async recentActivities(req: any, res: any) {
    const { tenantId } = req.query;
    const data = await prisma.auditLog.findMany({
      where: { tenantId },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    res.json({ success: true, data });
  }
}
