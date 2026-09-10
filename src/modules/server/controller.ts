import {
  Controller,
  Get,
  Req,
  Res,
  ApiOperation,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { ServerRepository } from "./repository.js";
import { success } from "@/common/utils/response.js";
import { RequirePermission } from "@/core/decorator/permission.js";

@Controller("/monitor/server", { tags: ["服务监控"] })
export default class ServerController {
  private repository = new ServerRepository();

  @Get("/info")
  @RequirePermission("monitor:server:info")
  @ApiOperation("服务器信息")
  async info(@Req() _req: Request, @Res() res: Response) {
    success(res, await this.repository.info());
  }
}
