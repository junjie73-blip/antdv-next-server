import {
  Controller,
  Get,
  Req,
  Res,
  ApiOperation,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { ServerRepository } from "./repository.js";
import { success } from "@/shared/http/response.js";
import { RequirePermission } from "@/core/decorator/permission.js";

@Controller("/monitor/server", { tags: ["服务监控"] })
export default class ServerController {
  private repository = new ServerRepository();

  @Get("/info")
  @ApiOperation("服务器信息")
  async info(@Req() _req: Request, @Res() res: Response) {
    success(res, await this.repository.info());
  }
  @Get("/snapshot")
  @ApiOperation("服务器实时快照（用于轮询）")
  async snapshot(@Req() req: Request, @Res() res: Response) {
    const data = await this.repository.getSnapshot();
    return success(res, data);
  }
}
