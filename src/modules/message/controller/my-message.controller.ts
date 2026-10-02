import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Req,
  Res,
  ApiOperation,
  ApiBody,
  ApiQuery,
  ApiResponse,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { z } from "zod";
import { MessageRepository } from "../repository.js";
import { MessageService } from "../service/index.js";
import { AppError } from "@/core/errors.js";
import { success, pageSuccess, error } from "@/shared/http/response.js";
import { logger } from "@/platform/logger/index.js";
import {
  MyMessageListSchema,
  BatchReadSchema,
  BatchDeleteSchema,
  ReadAllSchema,
} from "../schema.js";

interface AuthUser {
  userId: string;
  tenantId: string;
}

@Controller("/message", { tags: ["消息中心"] })
export default class MyMessageController {
  private repo = new MessageRepository();
  private service = new MessageService(this.repo);

  /* ============================================================
   * 列表
   * ============================================================ */
  @Get("/my")
  @ApiOperation("我的消息列表")
  @ApiQuery(MyMessageListSchema)
  @ApiResponse(200, "查询成功")
  async listMine(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const dto = MyMessageListSchema.parse(req.query);
      const data = await this.service.listMine(userId, tenantId, dto);
      pageSuccess(
        res,
        data.list,
        data.total,
        data.pageNum,
        data.pageSize,
        "查询成功",
      );
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * 未读数
   * ============================================================ */
  @Get("/unread-count")
  @ApiOperation("未读消息总数")
  @ApiQuery(
    z.object({
      bizType: z.string().optional().openapi({ description: "按业务类型过滤" }),
    }),
  )
  async unreadCount(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const bizType = req.query.bizType as string | undefined;
      const count = await this.service.getUnreadCount(
        userId,
        tenantId,
        bizType,
      );
      success(res, { count });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/unread-summary")
  @ApiOperation("未读数汇总（按业务类型）")
  async unreadSummary(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const data = await this.service.getUnreadSummary(userId, tenantId);
      success(res, data);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * 标记已读
   * ============================================================ */
  @Put("/:id/read")
  @ApiOperation("标记单条已读")
  async markRead(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      await this.service.markRead(req.params.id, userId, tenantId);
      success(res, null, "已标记为已读");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Put("/read-batch")
  @ApiOperation("批量标记已读")
  @ApiBody(BatchReadSchema)
  async markReadBatch(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const { messageIds } = BatchReadSchema.parse(req.body);
      const result = await this.service.markReadBatch(
        messageIds,
        userId,
        tenantId,
      );
      success(res, result, "已标记为已读");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Put("/read-all")
  @ApiOperation("标记全部已读")
  @ApiBody(ReadAllSchema)
  async markAllRead(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const dto = ReadAllSchema.parse(req.body ?? {});
      const result = await this.service.markAllRead(
        userId,
        tenantId,
        dto.bizType,
      );
      success(res, result, "已全部标记为已读");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * 删除
   * ============================================================ */
  @Delete("/:id")
  @ApiOperation("删除单条消息")
  async remove(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      await this.service.remove(req.params.id, userId, tenantId);
      success(res, null, "删除成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/batch-delete")
  @ApiOperation("批量删除消息")
  @ApiBody(BatchDeleteSchema)
  async removeBatch(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const { messageIds } = BatchDeleteSchema.parse(req.body);
      const result = await this.service.removeBatch(
        messageIds,
        userId,
        tenantId,
      );
      success(res, result, "删除成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Delete("/clear-read")
  @ApiOperation("清空已读消息", "未读消息保留")
  async clearRead(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const result = await this.service.clearRead(userId, tenantId);
      success(res, result, "清空成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * 工具
   * ============================================================ */
  private getAuth(req: Request): { userId: string; tenantId: string } {
    const user = req.user as AuthUser | undefined;
    if (!user?.userId) throw new AppError("未认证", 401001, 401);
    const tenantId = req.tenantId || user.tenantId;
    if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);
    return { userId: user.userId, tenantId };
  }

  private handleError(res: Response, err: unknown): void {
    if (res.headersSent) return;
    if (err instanceof AppError) {
      error(res, err.message, err.code, err.statusCode);
      return;
    }
    logger.error({ err }, "[MyMessage] error");
    error(res, "操作失败", 500, 500);
  }
}
