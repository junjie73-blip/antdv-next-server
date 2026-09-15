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
import { BaseController } from "@/core/base/controller.js";
import { NoticeRepository } from "./repository.js";
import { z } from "zod";
import { success } from "@/common/utils/response.js";
import { AppError } from "@/middleware/error-handler.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import { prisma } from "@/config/database.js";
import { pushNotice } from "./pusher.js";
import { keysToCamelCase } from "@/common/utils/case-convert.js";
import { NoticeService } from "./service.js";
import { upload } from "../user/controller.js";

@Controller("/notice", { tags: ["通知公告"] })
export default class NoticeController extends BaseController<
  any,
  any,
  any,
  any
> {
  protected readonly repository = new NoticeRepository();
  protected readonly service = new NoticeService(this.repository);
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
    await this.service.checkBeforeCreate(dto, req.tenantId!);
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
        throw new AppError("通知不存在", 404, 404);
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
      const data = await this.service.myNotices(
        req.tenantId!,
        req.user!.userId,
        req.query.pageNum.toString(),
        req.query.pageSize.toString(),
        req.query.isRead?.toString() || "0",
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
      success(res, null, "已标记为已读");
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
      success(res, { count }, "success");
    } catch (err) {
      this.handleError(res, err);
    }
  }
  @Post("/:id/send")
  @ApiOperation("手动发送通知", "立即发送指定通知给目标用户")
  @ApiResponse(200, "发送成功")
  async sendNotice(@Req() req: Request, @Res() res: Response) {
    try {
      await this.service.sendNotice(req.params.id, req.tenantId!); // ⭐
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
    await this.service.markManyAsRead(
      noticeIds,
      req.user!.userId,
      req.tenantId!,
    ); // ⭐
    success(res, null, "已标记为已读");
  }
  @Post("/:id/revoke")
  @ApiOperation("撤回通知", "已发布的通知可以撤回，撤回后用户不可见")
  async revoke(@Req() req, @Res() res) {
    try {
      await this.service.revokeNotice(
        req.params.id,
        req.tenantId!,
        req.user!.userId,
      );
      success(res, null, "已撤回");
    } catch (err) {
      this.handleError(res, err);
    }
  }
  @Get("/export")
  @ApiOperation("导出通知")
  async export(@Req() req: Request, @Res() res: Response) {
    const buffer = await this.service.exportToExcel(req.tenantId!);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=notices_${Date.now()}.xlsx`,
    );
    res.send(buffer);
  }

  @Post("/import")
  @ApiOperation("导入通知")
  async import(@Req() req: Request, @Res() res: Response) {
    upload.single("file")(req, res, async (err) => {
      if (err)
        return this.handleError(res, new AppError("文件上传失败", 400001, 400));
      if (!req.file)
        return this.handleError(res, new AppError("请上传 Excel", 400001, 400));
      const result = await this.service.importFromExcel(
        req.file.buffer,
        req.tenantId!,
        req.user?.userId,
      );
      success(res, result, "导入完成");
    });
  }
}
