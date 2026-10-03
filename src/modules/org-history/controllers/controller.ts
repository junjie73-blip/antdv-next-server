import {
  Controller,
  Get,
  Req,
  Res,
  ApiOperation,
  ApiQuery,
  Post,
  ApiBody,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { z } from "zod";
import { success, pageSuccess } from "@/shared/http/response.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import { OrgHistoryService } from "../services/service.js";
import { OrgHistoryListSchema } from "../schema.js";
import { OrgHistoryDashboardService } from "../services/dashboard.service.js";

const TimelineQuery = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

const AtQuery = z.object({
  at: z.string().datetime({ message: "at 必须是 ISO 时间" }),
});

@Controller("/system/org-history", { tags: ["组织架构历史"] })
export default class OrgHistoryController {
  private service = new OrgHistoryService();
  private dashboardService = new OrgHistoryDashboardService();
  @Get("/list")
  @ApiOperation("变更历史列表")
  @ApiQuery(OrgHistoryListSchema)
  async list(@Req() req: Request, @Res() res: Response) {
    const dto = OrgHistoryListSchema.parse(req.query);
    const data = await this.service.list({
      tenantId: req.tenantId!,
      ...dto,
      startTime: dto.startTime ? new Date(dto.startTime) : undefined,
      endTime: dto.endTime ? new Date(dto.endTime) : undefined,
    });
    return pageSuccess(res, data.list, data.total, dto.pageNum, dto.pageSize);
  }

  @Get("/user/:userId/timeline")
  @ApiOperation("员工组织时间线")
  @ApiQuery(TimelineQuery)
  async userTimeline(@Req() req: Request, @Res() res: Response) {
    const { limit } = TimelineQuery.parse(req.query);
    const data = await this.service.userTimeline(
      req.params.userId,
      req.tenantId!,
      limit,
    );
    return success(res, data);
  }

  @Get("/dept/:deptId/timeline")
  @ApiOperation("部门变更时间线")
  @ApiQuery(TimelineQuery)
  async deptTimeline(@Req() req: Request, @Res() res: Response) {
    const { limit } = TimelineQuery.parse(req.query);
    return success(
      res,
      await this.service.deptTimeline(req.params.deptId, req.tenantId!, limit),
    );
  }

  @Get("/user/:userId/dept-at")
  @ApiOperation("回溯：某时间点该员工所在部门")
  @ApiQuery(AtQuery)
  async userDeptAt(@Req() req: Request, @Res() res: Response) {
    const { at } = AtQuery.parse(req.query);
    return success(
      res,
      await this.service.userDeptAt(req.params.userId, req.tenantId!, at),
    );
  }

  @Get("/stats")
  @ApiOperation("变更统计")
  @ApiQuery(
    z.object({ days: z.coerce.number().int().min(7).max(365).default(30) }),
  )
  async stats(@Req() req: Request, @Res() res: Response) {
    const days = Number(req.query.days) || 30;
    return success(res, await this.service.stats(req.tenantId!, days));
  }
  @Post("/:id/revert")
  @ApiOperation("撤销变更（基于 before_data 反向执行）")
  @ApiBody(z.object({ reason: z.string().max(512).optional() }))
  async revert(@Req() req: Request, @Res() res: Response) {
    const dto = z
      .object({ reason: z.string().max(512).optional() })
      .parse(req.body ?? {});
    const result = await this.service.revert(
      req.params.id,
      req.tenantId!,
      { userId: req.user!.userId, username: req.user!.username },
      dto.reason,
    );
    return success(res, result, "已撤销");
  }
  @Get("/:id")
  @ApiOperation("历史详情（含 before/after diff）")
  async detail(@Req() req: Request, @Res() res: Response) {
    return success(
      res,
      await this.service.detail(req.params.id, req.tenantId!),
    );
  }
  @Get("/dashboard/overview")
  @ApiOperation("大屏 - 概览")
  async dashOverview(@Req() req: Request, @Res() res: Response) {
    return success(res, await this.dashboardService.getOverview(req.tenantId!));
  }

  @Get("/dashboard/daily-trend")
  @ApiOperation("大屏 - 每日趋势")
  @ApiQuery(
    z.object({ days: z.coerce.number().int().min(7).max(90).default(30) }),
  )
  async dashTrend(@Req() req: Request, @Res() res: Response) {
    const days = Number(req.query.days) || 30;
    return success(
      res,
      await this.dashboardService.getDailyTrend(req.tenantId!, days),
    );
  }

  @Get("/dashboard/dept-heatmap")
  @ApiOperation("大屏 - 部门调动热度")
  @ApiQuery(
    z.object({ days: z.coerce.number().int().min(7).max(90).default(30) }),
  )
  async dashHeatmap(@Req() req: Request, @Res() res: Response) {
    const days = Number(req.query.days) || 30;
    return success(
      res,
      await this.dashboardService.getDeptTransferHeatmap(req.tenantId!, days),
    );
  }

  @Get("/dashboard/top-operators")
  @ApiOperation("大屏 - Top 操作者")
  @ApiQuery(
    z.object({ days: z.coerce.number().int().min(7).max(90).default(30) }),
  )
  async dashTopOps(@Req() req: Request, @Res() res: Response) {
    const days = Number(req.query.days) || 30;
    return success(
      res,
      await this.dashboardService.getTopOperators(req.tenantId!, days),
    );
  }
  @Get("/dashboard/dept-time-matrix")
  @ApiOperation("大屏 - 部门 × 时间矩阵")
  @ApiQuery(
    z.object({
      days: z.coerce.number().int().min(7).max(90).default(30),
      metric: z.enum(["total", "assign", "revoke"]).default("total"),
    }),
  )
  async dashMatrix(@Req() req: Request, @Res() res: Response) {
    const days = Number(req.query.days) || 30;
    const metric = (req.query.metric as any) || "total";
    return success(
      res,
      await this.dashboardService.getDeptTimeMatrix(
        req.tenantId!,
        days,
        metric,
      ),
    );
  }

  @Get("/:id/revert-chain")
  @ApiOperation("撤销链追踪")
  async revertChain(@Req() req: Request, @Res() res: Response) {
    return success(
      res,
      await this.dashboardService.getRevertChain(req.params.id, req.tenantId!),
    );
  }
}
