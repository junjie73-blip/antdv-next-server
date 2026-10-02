import {
  Controller,
  Get,
  Put,
  Req,
  Res,
  ApiOperation,
  ApiBody,
  ApiQuery,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { z } from "zod";
import { success, pageSuccess, error } from "@/shared/http/response.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { WfCcRepository } from "../repository/wf-cc.repository.js";

interface AuthUser {
  userId: string;
  tenantId: string;
}

const MarkReadSchema = z.object({
  ccIds: z.array(z.string().uuid()).min(1).max(100),
});

@Controller("/workflow/cc", { tags: ["工作流-抄送"] })
export default class WfCcController {
  private repo = new WfCcRepository();

  @Get("/mine")
  @ApiOperation("我的抄送列表")
  @ApiQuery(
    z.object({
      pageNum: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
      isRead: z.coerce.number().int().min(0).max(1).optional(),
    }),
  )
  async mine(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const data = await this.repo.findMyPage(userId, tenantId, {
        pageNum: Number(req.query.pageNum) || 1,
        pageSize: Number(req.query.pageSize) || 20,
        isRead:
          req.query.isRead !== undefined ? Number(req.query.isRead) : undefined,
      });
      pageSuccess(res, data.list, data.total, data.pageNum, data.pageSize);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/unread-count")
  @ApiOperation("未读抄送数")
  async unreadCount(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const count = await this.repo.unreadCount(userId, tenantId);
      success(res, { count });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Put("/read")
  @ApiOperation("标记抄送已读")
  @ApiBody(MarkReadSchema)
  async markRead(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const { ccIds } = MarkReadSchema.parse(req.body);
      const updated = await this.repo.markRead(ccIds, userId, tenantId);
      success(res, { updated });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Put("/read-all")
  @ApiOperation("全部标记已读")
  async markAllRead(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const updated = await this.repo.markAllRead(userId, tenantId);
      success(res, { updated });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  private getAuth(req: Request): AuthUser {
    const user = req.user as AuthUser | undefined;
    if (!user?.userId) throw new AppError("未认证", 401001, 401);
    return { userId: user.userId, tenantId: req.tenantId || user.tenantId };
  }

  private handleError(res: Response, err: unknown) {
    if (res.headersSent) return;
    if (err instanceof AppError)
      return error(res, err.message, err.code, err.statusCode);
    logger.error({ err }, "[WfCc] error");
    error(res, "操作失败", 500, 500);
  }
}
