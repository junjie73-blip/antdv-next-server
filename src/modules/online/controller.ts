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
import { success } from "@/common/utils/response.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import { AppError } from "@/middleware/error-handler.js";
import { kickUser } from "@/core/ws/force-logout.js";

@Controller("/online", { tags: ["在线用户"] })
export default class OnlineController {
  private repository = new OnlineRepository();

  @Get("/list")
  @ApiOperation("在线用户列表")
  @ApiResponse(200, "查询成功")
  async list(@Req() req: Request, @Res() res: Response) {
    const data = await this.repository.list(req.tenantId!);
    success(res, data);
  }

  @Delete("/:userId")
  @ApiOperation("强制下线")
  @ApiResponse(200, "操作成功")
  async kick(@Req() req: Request, @Res() res: Response) {
    const { userId } = req.params;
    const operatorId = req.user!.userId;

    if (userId === operatorId) {
      throw new AppError("不能踢自己下线", 400, 400);
    }

    await kickUser(userId, {
      reason: "您已被管理员强制下线",
      operatorId,
    });

    success(res, null, "已将该用户强制下线");
  }

  @Post("/kick-all")
  @ApiOperation("全部下线")
  @ApiResponse(200, "操作成功")
  async kickAll(@Req() req: Request, @Res() res: Response) {
    await this.repository.kickAll(req.tenantId!);
    success(res, null, "已全部下线");
  }
}
