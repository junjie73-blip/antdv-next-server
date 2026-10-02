import {
  Controller,
  Get,
  Delete,
  Post,
  Req,
  Res,
  ApiOperation,
  ApiResponse,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { OnlineRepository } from "./repository.js";
import { success, error } from "@/shared/http/response.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { kickUser } from "@/platform/ws/force-logout.js";
import { env } from "@/config/env.js";

@Controller("/online", { tags: ["在线用户"] })
export default class OnlineController {
  private repository = new OnlineRepository();

  @Get("/list")
  @ApiOperation("在线用户列表")
  @ApiResponse(200, "查询成功")
  async list(@Req() req: Request, @Res() res: Response) {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);
      const data = await this.repository.list(tenantId);
      success(res, data);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Delete("/:userId")
  @ApiOperation("强制下线")
  @ApiResponse(200, "操作成功")
  async kick(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId } = req.params;
      const operatorId = req.user!.userId;

      // ✅ 可配置：默认不允许踢自己
      if (userId === operatorId && !env.ALLOW_SELF_KICK) {
        throw new AppError("不能踢自己下线", 400, 400);
      }

      await kickUser(userId, {
        reason: "您已被管理员强制下线",
        operatorId,
      });

      success(res, null, "已将该用户强制下线");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/kick-all")
  @ApiOperation("全部下线")
  @ApiResponse(200, "操作成功")
  async kickAll(@Req() req: Request, @Res() res: Response) {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);
      await this.repository.kickAll(tenantId);
      success(res, null, "已全部下线");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  private handleError(res: Response, err: unknown): void {
    if (err instanceof AppError) {
      return error(res, err.message, err.code, err.statusCode);
    }
    logger.error({ err }, "[Online] error");
    error(res, "操作失败", 500, 500);
  }
}
