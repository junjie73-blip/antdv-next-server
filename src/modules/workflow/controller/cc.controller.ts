import {
  Controller,
  Get,
  Put,
  Req,
  Res,
  ApiOperation,
  ApiQuery,
  ApiBody,
  ApiResponse,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { z } from "zod";
import { ccService } from "../service/cc.service.js";
import { AppError } from "@/core/errors.js";
import { success, pageSuccess, error } from "@/shared/http/response.js";
import { logger } from "@/platform/logger/index.js";

const CcListSchema = z
  .object({
    pageNum: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    isRead: z.coerce.number().int().min(0).max(1).optional(),
    keyword: z.string().max(128).optional(),
  })
  .openapi("WfCcList");

const BatchReadSchema = z
  .object({
    ccIds: z.array(z.string().uuid()).min(1).max(100),
  })
  .openapi("WfCcBatchRead");

interface AuthUser {
  userId: string;
  tenantId: string;
}

@Controller("/workflow/cc", { tags: ["工作流-抄送"] })
export default class CcController {
  @Get("/my")
  @ApiOperation("我的抄送列表")
  @ApiQuery(CcListSchema)
  @ApiResponse(200, "查询成功")
  async listMine(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const dto = CcListSchema.parse(req.query);
      const data = await ccService.listMine(userId, tenantId, dto);
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
      const count = await ccService.countUnread(userId, tenantId);
      success(res, { count });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Put("/:id/read")
  @ApiOperation("标记抄送已读")
  async markRead(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      await ccService.markRead(req.params.id, userId, tenantId);
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
      const { ccIds } = BatchReadSchema.parse(req.body);
      const result = await ccService.markReadBatch(ccIds, userId, tenantId);
      success(res, result, "已标记为已读");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Put("/read-all")
  @ApiOperation("全部标记已读")
  async markAllRead(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const result = await ccService.markAllRead(userId, tenantId);
      success(res, result, "已全部标记为已读");
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
    logger.error({ err }, "[WfCc] error");
    error(res, "操作失败", 500, 500);
  }
}
