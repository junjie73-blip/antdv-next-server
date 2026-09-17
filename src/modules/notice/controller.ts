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
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { BaseController } from "@/core/base/controller.js";
import { NoticeRepository } from "./repository.js";
import { NoticeService } from "./service.js";
import { AppError } from "@/core/errors.js";
import { success } from "@/common/utils/response.js";
import {
  NoticeCreateSchema,
  NoticeUpdateSchema,
  NoticeListSchema,
  SendNoticeSchema,
} from "./schema.js";
import z from "zod";
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
  async listNotice(@Req() req: Request, @Res() res: Response) {
    return super.list(req, res);
  }

  @Get("/detail/:id")
  @ApiOperation("获取通知详情")
  async getDetailNotice(@Req() req: Request, @Res() res: Response) {
    return super.detail(req, res);
  }

  @Post("/")
  @ApiOperation("创建通知")
  @ApiBody(NoticeCreateSchema)
  async createNotice(@Req() req: Request, @Res() res: Response) {
    return super.create(req, res);
  }

  @Put("/:id")
  @ApiOperation("更新通知")
  @ApiBody(NoticeUpdateSchema)
  async updateNotice(@Req() req: Request, @Res() res: Response) {
    return super.update(req, res);
  }

  @Delete("/:id")
  @ApiOperation("删除通知")
  async removeNotice(@Req() req: Request, @Res() res: Response) {
    return super.remove(req, res);
  }

  @Post("/:id/send")
  @ApiOperation("手动发送通知")
  async sendNotice(@Req() req: Request, @Res() res: Response) {
    try {
      const dto = SendNoticeSchema.parse(req.body ?? {});
      const receiversByChannel = { ...(dto.receiversByChannel ?? {}) };
      if (dto.emails?.length) {
        receiversByChannel.email = [
          ...new Set([...(receiversByChannel.email ?? []), ...dto.emails]),
        ];
      }
      const data = await this.service.sendNotice(req.params.id, req.tenantId!, {
        channels: dto.channels,
        receiversByChannel: Object.keys(receiversByChannel).length
          ? receiversByChannel
          : undefined,
        operatorId: req.user?.userId,
      });
      success(res, data, "发送完成");
    } catch (err) {
      if (err instanceof z.ZodError) {
        return this.handleError(
          res,
          new AppError(err.issues[0]?.message ?? "参数错误", 400001, 400),
        );
      }
      this.handleError(res, err);
    }
  }

  @Post("/:id/revoke")
  @ApiOperation("撤回通知")
  async revoke(@Req() req: Request, @Res() res: Response) {
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
    try {
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
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/import")
  @ApiOperation("导入通知")
  async import(@Req() req: Request, @Res() res: Response) {
    upload.single("file")(req, res, async (err) => {
      if (err)
        return this.handleError(res, new AppError("文件上传失败", 400001, 400));
      if (!req.file)
        return this.handleError(res, new AppError("请上传 Excel", 400001, 400));
      try {
        const result = await this.service.importFromExcel(
          req.file.buffer,
          req.tenantId!,
          req.user?.userId,
        );
        success(res, result, "导入完成");
      } catch (err) {
        this.handleError(res, err);
      }
    });
  }
}
