import {
  Controller,
  Get,
  Put,
  Req,
  Res,
  ApiOperation,
  ApiQuery,
  ApiBody,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { z } from "zod";
import { NoticeRepository } from "./repository.js";
import { NoticeService } from "./service.js";
import { error, success } from "@/shared/http/response.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/logger.js";

@Controller("/notice", { tags: ["我的消息"] })
export default class MyNoticeController {
  private repository = new NoticeRepository();
  private service = new NoticeService(this.repository);

  @Get("/my")
  @ApiOperation("获取我的通知列表")
  @ApiQuery(
    z.object({
      pageNum: z.number().default(1),
      pageSize: z.number().default(10),
      isRead: z.number().optional(),
    }),
  )
  async myNotices(@Req() req: Request, @Res() res: Response) {
    try {
      const pageNum = Number(req.query.pageNum) || 1;
      const pageSize = Number(req.query.pageSize) || 10;
      const isRead =
        req.query.isRead !== undefined ? Number(req.query.isRead) : undefined;

      const data = await this.repository.findNoticesForUser(
        req.user!.userId,
        req.tenantId!,
        pageNum,
        pageSize,
        isRead,
      );
      success(res, data);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/unread-count")
  @ApiOperation("获取未读通知数量")
  async unreadCount(@Req() req: Request, @Res() res: Response) {
    try {
      const count = await this.repository.getUnreadCount(
        req.user!.userId,
        req.tenantId!,
      );
      success(res, { count });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Put("/:id/read")
  @ApiOperation("标记通知已读")
  async markRead(@Req() req: Request, @Res() res: Response) {
    try {
      await this.repository.markAsRead(
        req.params.id,
        req.user!.userId,
        req.tenantId!,
      );
      success(res, null, "已标记为已读");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Put("/read-all")
  @ApiOperation("标记所有通知已读")
  @ApiBody(z.object({ noticeIds: z.array(z.string().uuid()).optional() }))
  async markAllRead(@Req() req: Request, @Res() res: Response) {
    try {
      const { noticeIds } = req.body;
      await this.service.markManyAsRead(
        noticeIds,
        req.user!.userId,
        req.tenantId!,
      );
      success(res, null, "已标记为已读");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  private handleError(res: Response, err: unknown) {
    if (err instanceof AppError)
      return error(res, err.message, err.code, err.statusCode);
    logger.error({ err }, "[MyNotice] error");
    error(res, "操作失败", 500, 500);
  }
}
