import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Tag,
  Summary,
  Description,
  Body,
  Query,
  Params,
  RequirePermission,
} from "@common/core/decorators.js";
import { BaseCrudController } from "@common/core/base-crud-controller.js";
import { NotificationRepository } from "./repository.js";
import { NotificationSchema, CreateNotificationBody } from "./schema.js";
import { z } from "zod";

@Controller("/notifications")
export default class NotificationController extends BaseCrudController {
  protected repository = new NotificationRepository();
  protected schemas = {
    tag: "通知管理",
    summaryPrefix: "通知",
    listQuery: z.object({
      tenantId: z.string(),
      page: z.coerce.number().optional(),
      limit: z.coerce.number().optional(),
      isRead: z
        .enum(["true", "false"])
        .optional()
        .transform((v) =>
          v === "true" ? true : v === "false" ? false : undefined,
        ),
    }),
    createBody: CreateNotificationBody,
    responseSchema: NotificationSchema,
  };
  protected defaultPermissions = {
    list: ["notification:read"],
    create: ["notification:publish"],
    delete: ["notification:manage"],
  };

  @Tag("通知管理")
  @Summary("获取我的通知列表")
  @RequirePermission("notification:read")
  @Get("/my")
  async myNotifications(req: any, res: any) {
    const { tenantId, page = 1, limit = 20, isRead } = req.query;
    const userId = req.user?.id;
    const result = await (this.repository as NotificationRepository).findByUser(
      userId,
      tenantId,
      { isRead, page: Number(page), limit: Number(limit) },
    );
    res.json({ success: true, data: result.data, total: result.total });
  }

  @Tag("通知管理")
  @Summary("获取未读通知数量")
  @RequirePermission("notification:read")
  @Get("/unread-count")
  async unreadCount(req: any, res: any) {
    const { tenantId } = req.query;
    const userId = req.user?.id;
    const count = await (
      this.repository as NotificationRepository
    ).getUnreadCount(userId, tenantId);
    res.json({ success: true, data: { count } });
  }

  @Tag("通知管理")
  @Summary("标记通知已读")
  @RequirePermission("notification:read")
  @Put("/:id/read")
  async markRead(req: any, res: any) {
    const { id } = req.params;
    const { tenantId } = req.query;
    const userId = req.user?.id;
    await (this.repository as NotificationRepository).markAsRead(
      userId,
      id,
      tenantId,
    );
    res.json({ success: true });
  }

  @Tag("通知管理")
  @Summary("标记全部已读")
  @RequirePermission("notification:read")
  @Put("/read-all")
  async markAllRead(req: any, res: any) {
    const { tenantId } = req.query;
    const userId = req.user?.id;
    await (this.repository as NotificationRepository).markAllAsRead(
      userId,
      tenantId,
    );
    res.json({ success: true });
  }
}
