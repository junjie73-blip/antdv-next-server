import {
  Controller,
  Get,
  Req,
  Res,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { DashboardRepository } from "./repository.js";
import { DashboardService } from "./service.js";
import { DashboardRangeSchema } from "./schema.js";
import { success } from "@/common/utils/response.js";
import { logger } from "@core/logger/index.js";

@Controller("/dashboard", { tags: ["仪表盘"] })
export default class DashboardController {
  private repository = new DashboardRepository();
  private service = new DashboardService(this.repository);

  @Get("/kpi")
  @ApiOperation("KPI 统计")
  async kpi(@Req() req: Request, @Res() res: Response) {
    try {
      success(res, await this.service.getKpi(req.tenantId!));
    } catch (err) {
      this.handleError(res, err, "获取 KPI 失败");
    }
  }

  @Get("/activity-trend")
  @ApiOperation("系统活动趋势")
  @ApiQuery(DashboardRangeSchema)
  async activityTrend(@Req() req: Request, @Res() res: Response) {
    try {
      const { range } = DashboardRangeSchema.parse(req.query);
      success(res, await this.service.getActivityTrend(req.tenantId!, range));
    } catch (err) {
      this.handleError(res, err, "获取活动趋势失败");
    }
  }

  // ... 其他方法同理，都改成 service.xxx + handleError

  private handleError(res: Response, err: unknown, message = "操作失败") {
    const { error } = require("@/common/utils/response.js");
    logger.error({ err }, `[Dashboard] ${message}`);
    error(res, message, 500, 500);
  }
}
