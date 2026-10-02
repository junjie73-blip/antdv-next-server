import {
  Controller,
  Get,
  Post,
  Put,
  Req,
  Res,
  ApiOperation,
  ApiQuery,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { z } from "zod";
import { success, pageSuccess } from "@/shared/http/response.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import { TenantIsolationService } from "./service.js";
import { TenantIsolationDashboardService } from "./dashboard.service.js";

const ListQuery = z.object({
  severity: z.enum(["info", "warning", "critical"]).optional(),
  resolved: z.coerce.number().int().min(0).max(1).optional(),
  ruleCode: z.string().max(64).optional(),
  pageNum: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

@Controller("/system/tenant-isolation", { tags: ["租户隔离审计"] })
export default class TenantIsolationController {
  private service = new TenantIsolationService();
  private dashboardService = new TenantIsolationDashboardService();
  @Get("/list")
  @ApiOperation("违规记录列表")
  @ApiQuery(ListQuery)
  async list(@Req() req: Request, @Res() res: Response) {
    const dto = ListQuery.parse(req.query);
    const data = await this.service.list(dto);
    return pageSuccess(res, data.list, data.total, dto.pageNum, dto.pageSize);
  }

  @Get("/summary")
  @ApiOperation("概览")
  async summary(@Req() _req: Request, @Res() res: Response) {
    return success(res, await this.service.getSummary());
  }

  @Post("/scan")
  @ApiOperation("手动触发扫描")
  async scan(@Req() req: Request, @Res() res: Response) {
    const result = await this.service.runFullScan("manual", req.user?.userId);
    return success(res, result, "扫描完成");
  }

  @Put("/:id/resolve")
  @ApiOperation("标记为已修复")
  async resolve(@Req() req: Request, @Res() res: Response) {
    await this.service.resolve(req.params.id, req.user!.userId);
    return success(res, null, "已标记");
  }
  @Get("/dashboard/overview")
  @ApiOperation("大屏 - 概览")
  async overview(@Req() _req: Request, @Res() res: Response) {
    return success(res, await this.dashboardService.getOverview());
  }

  @Get("/dashboard/trend")
  @ApiOperation("大屏 - 趋势")
  @ApiQuery(z.object({ days: z.coerce.number().min(7).max(90).default(30) }))
  async trend(@Req() req: Request, @Res() res: Response) {
    return success(
      res,
      await this.dashboardService.getTrend(Number(req.query.days) || 30),
    );
  }

  @Get("/dashboard/rule-distribution")
  @ApiOperation("大屏 - 规则分布")
  async ruleDist(@Req() _req: Request, @Res() res: Response) {
    return success(res, await this.dashboardService.getRuleDistribution());
  }

  @Get("/dashboard/table-heatmap")
  @ApiOperation("大屏 - 表热度")
  async heatmap(@Req() _req: Request, @Res() res: Response) {
    return success(res, await this.dashboardService.getTableHeatmap());
  }

  @Get("/dashboard/recent-runs")
  @ApiOperation("大屏 - 最近扫描历史")
  async recentRuns(@Req() _req: Request, @Res() res: Response) {
    return success(res, await this.dashboardService.getRecentRuns());
  }
}
