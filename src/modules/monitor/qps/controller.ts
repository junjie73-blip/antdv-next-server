import {
  Controller,
  Get,
  Req,
  Res,
  ApiOperation,
  ApiQuery,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { z } from "zod";
import { success } from "@/shared/http/response.js";
import { qpsMonitor } from "./singleton.js";

@Controller("/monitor/qps", { tags: ["QPS监控"] })
export default class QpsMonitorController {
  @Get("/summary")
  @ApiOperation("QPS 总览（含 Top 接口、状态分布）")
  @ApiQuery(
    z.object({
      windowSeconds: z.coerce.number().min(10).max(3600).default(300),
    }),
  )
  async summary(@Req() req: Request, @Res() res: Response) {
    const windowSeconds = Number(req.query.windowSeconds) || 300;
    const data = await qpsMonitor.getQpsData(windowSeconds);
    return success(res, data);
  }

  @Get("/history")
  @ApiOperation("QPS 历史曲线")
  @ApiQuery(z.object({ minutes: z.coerce.number().min(1).max(60).default(5) }))
  async history(@Req() req: Request, @Res() res: Response) {
    const minutes = Number(req.query.minutes) || 5;
    const data = qpsMonitor.getHistory(minutes);
    return success(res, data);
  }
}
