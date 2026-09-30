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
import { DatabaseMonitorService } from "./service.js";

@Controller("/monitor/database", { tags: ["数据库监控"] })
export default class DatabaseMonitorController {
  private service = new DatabaseMonitorService();

  @Get("/info")
  @ApiOperation("数据库基础信息")
  async info(@Req() req: Request, @Res() res: Response) {
    return success(res, await this.service.getInfo());
  }

  @Get("/slow-queries")
  @ApiOperation("慢查询")
  @ApiQuery(z.object({ limit: z.coerce.number().min(1).max(100).default(20) }))
  async slowQueries(@Req() req: Request, @Res() res: Response) {
    const limit = Number(req.query.limit) || 20;
    return success(res, await this.service.getSlowQueries(limit));
  }

  @Get("/tables")
  @ApiOperation("表统计")
  @ApiQuery(z.object({ limit: z.coerce.number().min(1).max(200).default(30) }))
  async tables(@Req() req: Request, @Res() res: Response) {
    const limit = Number(req.query.limit) || 30;
    return success(res, await this.service.getTableStats(limit));
  }

  @Get("/indexes")
  @ApiOperation("索引统计")
  @ApiQuery(z.object({ limit: z.coerce.number().min(1).max(100).default(20) }))
  async indexes(@Req() req: Request, @Res() res: Response) {
    const limit = Number(req.query.limit) || 20;
    return success(res, await this.service.getIndexStats(limit));
  }

  @Get("/bloat")
  @ApiOperation("表膨胀检测")
  async bloat(@Req() req: Request, @Res() res: Response) {
    return success(res, await this.service.getBloatTables());
  }
}
