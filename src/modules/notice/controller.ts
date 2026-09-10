import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Req,
  Res,
  ApiOperation,
  ApiBody,
  ApiQuery,
  ApiResponse,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import {
  NoticeUpdateSchema,
  NoticeListSchema,
  NoticeCreateSchema,
} from "./schema.js";
import { BaseController } from "@/core/base-controller.js";
import { NoticeRepository } from "./repository.js";
import z from "zod";
import { success } from "@/common/utils/response.js";
import { AppError } from "@/middleware/error-handler.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import { prisma } from "@/config/database.js";
import { pushNotice } from "./pusher.js";
import { keysToCamelCase } from "@/common/utils/case-convert.js";

@Controller("/notice", { tags: ["通知公告"] })
export default class NoticeController extends BaseController<
  any,
  any,
  any,
  any
> {
  protected readonly repository = new NoticeRepository();
  protected readonly config = {
    routePrefix: "/api/v1/notice",
    tags: ["通知公告"],
    permissionPrefix: "notice",
    enableAudit: true,
    defaultPageSize: 10,
    maxPageSize: 100,
  };
  protected readonly createSchema = NoticeCreateSchema;
  protected readonly updateSchema = NoticeUpdateSchema;
  protected readonly querySchema = NoticeListSchema;
  async beforeCreate(dto: any, req: Request): Promise<any> {
    dto = await super.beforeCreate(dto, req);
    const tenantId = req.tenantId!;
    const exist = await (this.repository as NoticeRepository).findOne(
      { title: dto.title },
      tenantId,
    );
    if (exist) {
      throw new AppError(409, `通知标题 '${dto.title}' 已存在`, 409);
    }
    return dto;
  }
  @Get("/list")
  @ApiOperation("获取通知列表")
  @ApiQuery(NoticeListSchema)
  @ApiResponse(200, "查询成功")
  async listNotice(@Req() req: Request, @Res() res: Response) {
    return super.list(req, res);
  }

  @Post("/")
  @ApiOperation("创建通知")
  @ApiBody(NoticeCreateSchema)
  @ApiResponse(200, "创建成功")
  async createNotice(@Req() req: Request, @Res() res: Response) {
    return super.create(req, res);
  }

  @Post("/:id")
  @ApiOperation("更新通知")
  @ApiBody(NoticeUpdateSchema)
  @ApiResponse(200, "更新成功")
  async updateNotice(@Req() req: Request, @Res() res: Response) {
    return super.update(req, res);
  }

  @Get("/remove/:id")
  @ApiOperation("删除通知")
  @ApiResponse(200, "删除成功")
  async removeNotice(@Req() req: Request, @Res() res: Response) {
    return super.remove(req, res);
  }

  @Get("/detail/:id")
  @ApiOperation("获取通知详情")
  @ApiResponse(200, "查询成功")
  async getDetailNotice(@Req() req: Request, @Res() res: Response) {
    try {
      const noticeId = req.params.id;
      const tenantId = req.tenantId!;
      const detail = await (
        this.repository as NoticeRepository
      ).findDetailWithTargetUserIds(noticeId, tenantId);
      if (!detail) {
        throw new AppError(404, "通知不存在", 404);
      }
      // 转换字段名为驼峰（如果 repository 返回 snake_case）
      const result = keysToCamelCase(detail);
      success(res, result);
    } catch (err) {
      this.handleError(res, err);
    }
  }
  @Get("/my")
  @ApiOperation("获取我的通知列表")
  @ApiQuery(
    z.object({
      pageNum: z.number().default(1),
      pageSize: z.number().default(10),
      isRead: z.number().optional(),
    }),
  )
  @ApiResponse(200, "查询成功")
  async myNotices(@Req() req: Request, @Res() res: Response) {
    try {
      const pageNum = Number(req.query.pageNum) || 1;
      const pageSize = Number(req.query.pageSize) || 10;
      const data = await (
        this.repository as NoticeRepository
      ).findNoticesForUser(
        req.user.userId,
        req.tenantId!,
        pageNum,
        pageSize,
        req.query.isRead,
      );
      success(res, data);
    } catch (err) {
      this.handleError(res, err);
    }
  }
  // 标记已读
  @Put("/:id/read")
  @ApiOperation("标记通知已读")
  @ApiResponse(200, "操作成功")
  async markRead(@Req() req: Request, @Res() res: Response) {
    try {
      await (this.repository as NoticeRepository).markAsRead(
        req.params.id,
        req.user!.userId,
        req.tenantId!,
      );
      res.json({
        code: 200,
        message: "已标记为已读",
        data: null,
        timestamp: Date.now(),
      });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  // 获取未读数量
  @Get("/unread-count")
  @ApiOperation("获取未读通知数量")
  @ApiResponse(200, "查询成功")
  async unreadCount(@Req() req: Request, @Res() res: Response) {
    try {
      const count = await (this.repository as NoticeRepository).getUnreadCount(
        req.user!.userId,
        req.tenantId!,
      );
      res.json({
        code: 200,
        message: "success",
        data: { count },
        timestamp: Date.now(),
      });
    } catch (err) {
      this.handleError(res, err);
    }
  }
  @Post("/:id/send")
  @ApiOperation("手动发送通知", "立即发送指定通知给目标用户")
  @ApiResponse(200, "发送成功")
  async sendNotice(@Req() req: Request, @Res() res: Response) {
    try {
      const noticeId = req.params.id;
      const tenantId = req.tenantId!;

      // 检查通知是否存在且已发布
      const notice = await prisma.sys_notice.findFirst({
        where: {
          notice_id: noticeId,
          tenant_id: tenantId,
          is_deleted: 0,
          status: "1",
        },
        include: { target_users: { select: { user_id: true } } },
      });

      if (!notice) {
        throw new AppError(404, "通知不存在或未发布", 404);
      }

      if (!notice.target_users || notice.target_users.length === 0) {
        throw new AppError(400, "该通知没有指定目标用户，无法发送", 400);
      }

      // 调用推送逻辑
      await pushNotice(noticeId);
      success(res, null, "发送成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }
  @Put("/read-all")
  @ApiOperation("标记所有通知已读")
  @ApiResponse(200, "操作成功")
  async markAllRead(@Req() req: Request, @Res() res: Response) {
    const { noticeIds } = req.body;
    await prisma.sys_notice_user.updateMany({
      where: {
        notice_id: { in: noticeIds },
        user_id: req.user!.userId,
        tenant_id: req.tenantId!,
      },
      data: { is_read: 1, read_time: new Date() },
    });
    success(res, null, "已标记为已读");
  }
}
