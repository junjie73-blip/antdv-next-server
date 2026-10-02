import {
  Controller,
  Post,
  Get,
  Req,
  Res,
  ApiOperation,
  ApiBody,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { success, error } from "@/shared/http/response.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { WfTaskTransferService } from "../service/task-transfer.service.js";
import { AddSignSchema, TransferTaskSchema } from "../schema.js";
import { z } from "zod";
import { wfRollbackService } from "../service/rollback.service.js";

interface AuthUser {
  userId: string;
  tenantId: string;
}

@Controller("/workflow/task", { tags: ["工作流-任务流转"] })
export default class WfTaskTransferController {
  private service = new WfTaskTransferService();

  @Post("/:id/add-sign")
  @ApiOperation("加签（前加签/后加签）")
  @ApiBody(AddSignSchema)
  async addSign(@Req() req: Request, @Res() res: Response) {
    try {
      const user = this.getAuth(req);
      const dto = AddSignSchema.parse(req.body);
      const result = await this.service.addSign(
        req.params.id,
        user.tenantId,
        user.userId,
        dto,
      );
      success(res, result, "加签成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/:id/transfer")
  @ApiOperation("转办")
  @ApiBody(TransferTaskSchema)
  async transfer(@Req() req: Request, @Res() res: Response) {
    try {
      const user = this.getAuth(req);
      const dto = TransferTaskSchema.parse(req.body);
      await this.service.transfer(
        req.params.id,
        user.tenantId,
        user.userId,
        dto,
      );
      success(res, null, "转办成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/:id/transfer-history")
  @ApiOperation("加签/转办历史")
  async history(@Req() req: Request, @Res() res: Response) {
    try {
      const user = this.getAuth(req);
      const data = await this.service.history(req.params.id, user.tenantId);
      success(res, data);
    } catch (err) {
      this.handleError(res, err);
    }
  }
  @Post("/:id/rollback")
  @ApiOperation("回退任务到上一节点")
  @ApiBody(
    z.object({
      targetNodeId: z.string().max(64).optional(),
      reason: z.string().min(1).max(1000),
    }),
  )
  async rollback(@Req() req: Request, @Res() res: Response) {
    try {
      const user = this.getAuth(req);
      const dto = req.body;
      await wfRollbackService.rollback(
        req.params.id,
        user.tenantId,
        user.userId,
        dto,
      );
      success(res, null, "回退成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }
  @Post("/batch-transfer")
  @ApiOperation("批量转办（管理员）")
  @ApiBody(
    z.object({
      sourceUserId: z.string().uuid(),
      targetUserId: z.string().uuid(),
      instanceIds: z.array(z.string().uuid()).max(500).optional(),
      nodeIds: z.array(z.string().max(64)).max(50).optional(),
      comment: z.string().max(1000).optional(),
    }),
  )
  async batchTransfer(@Req() req: Request, @Res() res: Response) {
    try {
      const user = this.getAuth(req);
      const dto = req.body as any;
      const result = await this.service.batchTransfer(
        user.tenantId,
        user.userId,
        dto,
      );
      success(res, result, `已转办 ${result.transferred} 条任务`);
    } catch (err) {
      this.handleError(res, err);
    }
  }
  private getAuth(req: Request): AuthUser {
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
    logger.error({ err }, "[WfTaskTransfer] error");
    error(res, "操作失败", 500, 500);
  }
}
