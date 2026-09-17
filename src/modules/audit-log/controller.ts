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
import { AuditLogRepository } from "./repository.js";
import { AuditLogService } from "./service.js";
import { AuditLogListSchema, AuditLogExportSchema } from "./schema.js";
import { success } from "@/common/utils/response.js";
import { BaseController } from "@/core/base/controller.js";
import { AppError } from "@/core/errors.js";

@Controller("/audit-log", { tags: ["审计日志"] })
export default class AuditLogController extends BaseController<
  any,
  any,
  any,
  any
> {
  protected readonly repository = new AuditLogRepository();
  protected readonly service = new AuditLogService(this.repository);
  protected readonly config = {
    routePrefix: "/api/v1/audit-log",
    tags: ["审计日志"],
    permissionPrefix: "audit-log",
    enableAudit: true,
    defaultPageSize: 10,
    maxPageSize: 100,
  };
  protected readonly createSchema = undefined;
  protected readonly updateSchema = undefined;
  protected readonly querySchema = AuditLogListSchema;
  protected isSoftDeleteTable(): boolean {
    return false;
  }
  @Get("/list")
  @ApiOperation("获取审计日志列表")
  @ApiQuery(AuditLogListSchema)
  async logList(@Req() req: Request, @Res() res: Response) {
    return super.list(req, res);
  }

  @Get("/export")
  @ApiOperation("导出审计日志")
  @ApiQuery(AuditLogExportSchema)
  async export(@Req() req: Request, @Res() res: Response) {
    try {
      const where = this.buildListWhere(req.query as any);
      const buffer = await this.service.exportToExcel(where);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=audit_logs_${Date.now()}.xlsx`,
      );
      res.send(buffer);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/detail/:id")
  @ApiOperation("获取审计日志详情")
  async detail(@Req() req: Request, @Res() res: Response) {
    try {
      const log = await this.service.findDetail(req.params.id, req.tenantId!);
      if (!log) throw new AppError("日志不存在", 404001, 404);
      success(res, log);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  protected buildListWhere(query: any): any {
    const where: any = {};
    if (query.username) where.username = { contains: query.username };
    if (query.operation) where.operation = { contains: query.operation };
    if (query.method) where.method = query.method.toUpperCase();
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
}
