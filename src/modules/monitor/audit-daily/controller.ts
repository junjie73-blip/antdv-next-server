import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  ApiOperation,
  ApiQuery,
  ApiBody,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { z } from "zod";
import { error, success } from "@/shared/http/response.js";
import { AppError } from "@/core/errors.js";
import { AuditDailyService } from "./service.js";
import {
  AggregateSchema,
  DailyQuerySchema,
  TopOperationsQuerySchema,
} from "./schema.js";
import { logger } from "@/platform/logger/logger.js";

interface AuthUser {
  userId: string;
  tenantId: string;
}

@Controller("/monitor/audit-daily", { tags: ["审计日报"] })
export default class AuditDailyController {
  private service = new AuditDailyService();

  /* ============================================================
   * ⭐ 概览
   * ============================================================ */
  @Get("/overview")
  @ApiOperation("审计日报概览")
  @ApiQuery(DailyQuerySchema)
  async overview(@Req() req: Request, @Res() res: Response) {
    try {
      const { tenantId } = req.user as AuthUser;
      const dto = DailyQuerySchema.parse(req.query);
      return success(res, await this.service.getOverview(tenantId, dto));
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * ⭐ 趋势
   * ============================================================ */
  @Get("/trend")
  @ApiOperation("审计日报趋势")
  @ApiQuery(DailyQuerySchema)
  async trend(@Req() req: Request, @Res() res: Response) {
    try {
      const { tenantId } = req.user as AuthUser;
      const dto = DailyQuerySchema.parse(req.query);
      return success(res, await this.service.getTrend(tenantId, dto));
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * ⭐ Top 操作
   * ============================================================ */
  @Get("/top-operations")
  @ApiOperation("Top 操作")
  @ApiQuery(DailyQuerySchema)
  @ApiQuery(
    z.object({ limit: z.coerce.number().int().min(1).max(100).default(20) }),
  )
  async topOperations(@Req() req: Request, @Res() res: Response) {
    try {
      const { tenantId } = req.user as AuthUser;
      const dto = TopOperationsQuerySchema.parse(req.query);
      const limit = dto.limit ?? 20;
      return success(
        res,
        await this.service.getTopOperations(tenantId, dto, limit),
      );
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * ⭐ 操作列表（筛选下拉）
   * ============================================================ */
  @Get("/operations")
  @ApiOperation("操作类型列表")
  async operations(@Req() req: Request, @Res() res: Response) {
    try {
      const { tenantId } = req.user as AuthUser;
      return success(res, await this.service.listOperations(tenantId));
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * ⭐ 手动触发聚合（管理员专用）
   * ============================================================ */
  @Post("/aggregate")
  @ApiOperation("手动触发指定日期的聚合")
  @ApiBody(AggregateSchema)
  async aggregate(@Req() req: Request, @Res() res: Response) {
    try {
      const { tenantId } = req.user as AuthUser;
      const dto = AggregateSchema.parse(req.body ?? {});

      // 默认昨天
      const date =
        dto.date ?? new Date(Date.now() - 86400000).toISOString().slice(0, 10);

      const result = await this.service.aggregateDate(date, tenantId);
      return success(res, result, "聚合完成");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * ⭐ 清理（管理员专用）
   * ============================================================ */
  @Post("/clean")
  @ApiOperation("清理 2 年前数据")
  async clean(@Req() req: Request, @Res() res: Response) {
    try {
      const { tenantId } = req.user as AuthUser;
      const result = await this.service.cleanExpired(tenantId);
      return success(res, result, "清理完成");
    } catch (err) {
      this.handleError(res, err);
    }
  }
  handleError(res: Response, err: AppError) {
    if (res.headersSent) return;
    if (err instanceof AppError) {
      error(res, err.message, err.code, err.statusCode);
      return;
    }
    logger.error({ err }, "Controller error");
    error(res, "操作失败", 500, 500);
  }
}
