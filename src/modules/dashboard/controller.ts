import {
  Controller,
  Get,
  Req,
  Res,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { DashboardRepository } from "./repository.js";
import { DashboardRangeSchema } from "./schema.js";
import { success, error } from "@/common/utils/response.js";

@Controller("/dashboard", { tags: ["仪表盘"] })
export default class DashboardController {
  private repository = new DashboardRepository();

  @Get("/kpi")
  @ApiOperation("KPI 统计", "获取今日访问、活跃用户、API 调用等 KPI")
  @ApiResponse(200, "查询成功")
  async kpi(@Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.repository.getKpi(req.tenantId!);
      success(res, data);
    } catch (err) {
      console.error(err);
      error(res, "获取 KPI 失败", 500, 500);
    }
  }

  @Get("/activity-trend")
  @ApiOperation("系统活动趋势", "PV/UV/API 调用趋势")
  @ApiQuery(DashboardRangeSchema)
  @ApiResponse(200, "查询成功")
  async activityTrend(@Req() req: Request, @Res() res: Response) {
    try {
      const { range } = DashboardRangeSchema.parse(req.query);
      const data = await this.repository.getActivityTrend(req.tenantId!, range);
      success(res, data);
    } catch (err) {
      console.error(err);
      error(res, "获取活动趋势失败", 500, 500);
    }
  }

  @Get("/traffic-distribution")
  @ApiOperation("流量来源分布", "按 HTTP 方法分布")
  @ApiResponse(200, "查询成功")
  async trafficDistribution(@Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.repository.getTrafficDistribution(req.tenantId!);
      success(res, data);
    } catch (err) {
      console.error(err);
      error(res, "获取流量分布失败", 500, 500);
    }
  }

  @Get("/system-health")
  @ApiOperation("系统健康度", "根据失败率与响应时间计算")
  @ApiResponse(200, "查询成功")
  async systemHealth(@Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.repository.getSystemHealth(req.tenantId!);
      success(res, data);
    } catch (err) {
      console.error(err);
      error(res, "获取系统健康度失败", 500, 500);
    }
  }

  @Get("/resource-usage")
  @ApiOperation("资源使用概况", "雷达图展示资源使用")
  @ApiResponse(200, "查询成功")
  async resourceUsage(@Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.repository.getResourceUsage(req.tenantId!);
      success(res, data);
    } catch (err) {
      console.error(err);
      error(res, "获取资源使用失败", 500, 500);
    }
  }

  @Get("/error-rate")
  @ApiOperation("API 错误率趋势", "按小时统计错误率")
  @ApiResponse(200, "查询成功")
  async errorRate(@Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.repository.getErrorRateTrend(req.tenantId!);
      success(res, data);
    } catch (err) {
      console.error(err);
      error(res, "获取错误率失败", 500, 500);
    }
  }

  @Get("/user-journey")
  @ApiOperation("用户行为漏斗", "按操作类型统计漏斗")
  @ApiResponse(200, "查询成功")
  async userJourney(@Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.repository.getUserJourney(req.tenantId!);
      success(res, data);
    } catch (err) {
      console.error(err);
      error(res, "获取用户行为失败", 500, 500);
    }
  }

  @Get("/module-rank")
  @ApiOperation("模块使用热度", "按 URL 前缀统计")
  @ApiResponse(200, "查询成功")
  async moduleRank(@Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.repository.getModuleRank(req.tenantId!);
      success(res, data);
    } catch (err) {
      console.error(err);
      error(res, "获取模块排行失败", 500, 500);
    }
  }
}
