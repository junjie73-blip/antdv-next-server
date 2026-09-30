import {
  Controller,
  Get,
  Req,
  Res,
  ApiOperation,
  ApiQuery,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { LoginLogRepository } from "./repository.js";
import { LoginLogService } from "./service.js";
import { LoginLogListSchema, LoginLogExportSchema } from "./schema.js";
import { error, success } from "@/shared/http/response.js";
import { BaseController } from "@/core/base/controller.js";
import dayjs from "dayjs";
import { z } from "zod";
import { AppError } from "@/middleware/index.js";
import { logger } from "@/platform/logger/logger.js";

@Controller("/login-log", { tags: ["登录日志"] })
export default class LoginLogController extends BaseController<
  any,
  any,
  any,
  any
> {
  protected readonly repository = new LoginLogRepository();
  protected readonly service = new LoginLogService(this.repository);
  protected readonly config = {
    routePrefix: "/api/v1/login-log",
    tags: ["登录日志"],
    permissionPrefix: "login-log",
    enableAudit: true,
    defaultPageSize: 10,
    maxPageSize: 100,
  };
  protected readonly createSchema = z.object({});
  protected readonly updateSchema = z.object({});
  protected readonly querySchema = LoginLogListSchema;

  @Get("/list")
  @ApiOperation("获取登录日志列表")
  @ApiQuery(LoginLogListSchema)
  async listLoginLog(@Req() req: Request, @Res() res: Response) {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);
      const data = await this.repository.findPage(
        { ...(req.query as any), tenantId }, // ✅ 注入
        {},
      );
      success(res, data); // ✅ 补 send
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/export")
  async export(@Req() req: Request, @Res() res: Response) {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);
      const where = {
        ...this.buildListWhere(req.query as any),
        tenant_id: tenantId,
      };
      const buffer = await this.service.exportToExcel(where, tenantId);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=login_logs_${Date.now()}.xlsx`,
      );
      res.send(buffer);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  protected buildListWhere(query: any): any {
    const where: any = {};
    if (query.username) where.username = { contains: query.username };
    if (query.status !== undefined) where.status = query.status;
    if (query.startTime)
      where.created_at = {
        ...(where.created_at || {}),
        gte: new Date(query.startTime),
      };
    if (query.endTime)
      where.created_at = {
        ...(where.created_at || {}),
        lte: new Date(query.endTime),
      };
    return where;
  }
  protected handleError(res: Response, err: unknown): void {
    if (err instanceof AppError)
      return error(res, err.message, err.code, err.statusCode);
    logger.error({ err }, "[LoginLog] error");
    error(res, "操作失败", 500, 500);
  }
}
