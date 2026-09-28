import {
  Controller,
  Get,
  Req,
  Res,
  ApiOperation,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { WorkbenchRepository } from "./repository.js";
import { success } from "@/shared/http/response.js";

@Controller("/workbench", { tags: ["工作台"] })
export default class WorkbenchController {
  private repository = new WorkbenchRepository();

  @Get("/summary")
  @ApiOperation("工作台概览")
  async summary(@Req() req: Request, @Res() res: Response) {
    const data = await this.repository.summary(req.user!.userId, req.tenantId!);
    success(res, data);
  }
}
