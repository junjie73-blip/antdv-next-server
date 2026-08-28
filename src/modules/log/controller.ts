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
import { queryLogs } from "@common/logger/query.js";
import { authMiddleware } from "@common/middleware/auth.js";
import { prisma } from "@config/database.js";

@Controller("/logs")
export default class LogController {
  protected defaultPermissions = {
    list: ["log:read"],
  };

  // ========== 系统日志查询（修复不兼容类型）==========
  @Tag("系统日志")
  @Summary("查询应用日志")
  @Middleware(authMiddleware)
  @RequirePermission("log:read")
  @Query(
    z.object({
      level: z.enum(["info", "warn", "error", "fatal"]).optional(),
      type: z.enum(["audit", "access", "error"]).optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      limit: z.string().optional(),
      offset: z.string().optional(),
    }),
  )
  @ApiResponse(
    200,
    z.object({
      success: z.boolean(),
      data: z.array(z.unknown()),
    }),
    "查询成功",
  )
  @Get("/")
  async query(req: any, res: any) {
    const logs = await queryLogs({
      level: req.query.level,
      type: req.query.type,
      startTime: req.query.startTime,
      endTime: req.query.endTime,
      limit: Number(req.query.limit) || 100,
      offset: Number(req.query.offset) || 0,
    });
    res.json({ success: true, data: logs });
  }

  // ========== 审计日志列表（新增）==========
  @Tag("系统日志")
  @Summary("查询审计日志（数据库）")
  @Middleware(authMiddleware)
  @RequirePermission("log:read")
  @Query(
    z.object({
      tenantId: z.string(),
      userId: z.string().optional(),
      action: z.string().optional(),
      resource: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  )
  @ApiResponse(
    200,
    z.object({
      success: z.boolean(),
      data: z.array(z.unknown()),
      total: z.number(),
    }),
    "查询成功",
  )
  @Get("/audit")
  async auditLogs(req: any, res: any) {
    const {
      tenantId,
      userId,
      action,
      resource,
      startTime,
      endTime,
      page = "1",
      limit = "20",
    } = req.query;

    const where: any = { tenantId };
    if (userId) where.userId = userId;
    if (action) where.action = { contains: action };
    if (resource) where.resource = resource;
    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) where.createdAt.gte = new Date(startTime);
      if (endTime) where.createdAt.lte = new Date(endTime);
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ success: true, data, total });
  }

  // ========== 日志统计（新增）==========
  @Tag("系统日志")
  @Summary("日志统计（按天/类型聚合）")
  @Middleware(authMiddleware)
  @RequirePermission("log:read")
  @Query(
    z.object({
      tenantId: z.string(),
      days: z.string().optional(),
    }),
  )
  @ApiResponse(
    200,
    z.object({
      success: z.boolean(),
      data: z.object({
        daily: z.array(z.unknown()),
        byAction: z.array(z.unknown()),
        byResource: z.array(z.unknown()),
      }),
    }),
    "统计成功",
  )
  @Get("/stats")
  async stats(req: any, res: any) {
    const { tenantId, days = "7" } = req.query;
    const dayCount = Number(days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dayCount);

    // 按天统计
    const daily = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM audit_logs
      WHERE tenant_id = ${tenantId}
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    // 按 action 统计
    const byAction = await prisma.auditLog.groupBy({
      by: ["action"],
      where: { tenantId, createdAt: { gte: startDate } },
      _count: { action: true },
      orderBy: { _count: { action: "desc" } },
      take: 10,
    });

    // 按 resource 统计
    const byResource = await prisma.auditLog.groupBy({
      by: ["resource"],
      where: { tenantId, createdAt: { gte: startDate } },
      _count: { resource: true },
      orderBy: { _count: { resource: "desc" } },
      take: 10,
    });

    res.json({
      success: true,
      data: {
        daily,
        byAction: byAction.map((a: any) => ({
          action: a.action,
          count: a._count.action,
        })),
        byResource: byResource.map((r: any) => ({
          resource: r.resource,
          count: r._count.resource,
        })),
      },
    });
  }
}
