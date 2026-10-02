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
import { logService } from "./service.js";
import { AppError } from "@/core/errors.js";
import { success, error } from "@/shared/http/response.js";
import { logger } from "@/platform/logger/index.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import {
  LogQuerySchema,
  QuickSearchSchema,
} from "@/platform/logging/schema.js";

@Controller("/monitor/logs", { tags: ["日志检索"] })
export default class LogController {
  @Get("/status")
  @RequirePermission("monitor:logs:list")
  @ApiOperation("日志聚合是否启用")
  async status(@Req() _req: Request, @Res() res: Response) {
    try {
      success(res, { enabled: logService.isEnabled() });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/quick-search")
  @RequirePermission("monitor:logs:list")
  @ApiOperation("快捷检索（按级别/模块/关键词）")
  @ApiQuery(QuickSearchSchema)
  async quickSearch(@Req() req: Request, @Res() res: Response) {
    try {
      const dto = QuickSearchSchema.parse(req.query);
      success(res, await logService.quickSearch(dto));
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/query")
  @RequirePermission("monitor:logs:query")
  @ApiOperation("LogQL 结构化查询")
  @ApiBody(LogQuerySchema)
  async query(@Req() req: Request, @Res() res: Response) {
    try {
      const dto = LogQuerySchema.parse(req.body);
      success(res, await logService.query(dto));
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/by-trace/:traceId")
  @RequirePermission("monitor:logs:list")
  @ApiOperation("按 traceId 查询链路日志")
  async byTrace(@Req() req: Request, @Res() res: Response) {
    try {
      const limit = Number(req.query.limit) || 500;
      success(res, await logService.byTraceId(req.params.traceId, limit));
    } catch (err) {
      this.handleError(res, err);
    }
  }

  private handleError(res: Response, err: unknown): void {
    if (res.headersSent) return;
    if (err instanceof AppError) {
      error(res, err.message, err.code, err.statusCode);
      return;
    }
    logger.error({ err }, "[LogMonitor] error");
    error(res, "操作失败", 500, 500);
  }
}
