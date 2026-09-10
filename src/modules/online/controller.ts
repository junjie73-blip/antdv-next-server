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

@Controller("/online", { tags: ["在线用户"] })
export default class OnlineController {
  private repository = new OnlineRepository();

  @Get("/list")
  @RequirePermission("monitor:online:list")
  @ApiOperation("在线用户列表")
  @ApiResponse(200, "查询成功")
  async list(@Req() req: Request, @Res() res: Response) {
    const data = await this.repository.list(req.tenantId!);
    success(res, data);
  }

  @Delete("/:userId")
  @RequirePermission("monitor:online:kick")
  @ApiOperation("强制下线")
  @ApiResponse(200, "操作成功")
  async kick(@Req() req: Request, @Res() res: Response) {
    await this.repository.kick(req.params.userId);
    success(res, null, "已强制下线");
  }

  @Post("/kick-all")
  @RequirePermission("monitor:online:kick")
  @ApiOperation("全部下线")
  @ApiResponse(200, "操作成功")
  async kickAll(@Req() req: Request, @Res() res: Response) {
    await this.repository.kickAll(req.tenantId!);
    success(res, null, "已全部下线");
  }
}
