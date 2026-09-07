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
import { AuditLogListSchema, AuditLogExportSchema } from "./schema.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import { success, error } from "@/common/utils/response.js";
import * as XLSX from "xlsx";

@Controller("/audit-log", { tags: ["审计日志"] })
export default class AuditLogController {
  private repository = new AuditLogRepository();

  @Get("/list")
  @ApiOperation("获取审计日志列表")
  @ApiQuery(AuditLogListSchema)
  @ApiResponse(200, "查询成功")
  async list(@Req() req: Request, @Res() res: Response) {
    try {
      const query = {
        tenantId: req.tenantId!,
        username: req.query.username as string,
        operation: req.query.operation as string,
        method: req.query.method as string,
        startTime: req.query.startTime as string,
        endTime: req.query.endTime as string,
      };
      const where = this.buildWhere(query);
      const data = await this.repository.findPage(query, where);
      // 可选：数据转换
      data.list = data.list.map((item: any) => ({
        ...item,
        created_at: item.created_at?.toISOString(),
      }));
      success(res, data);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/export")
  @ApiOperation("导出审计日志")
  @ApiQuery(AuditLogExportSchema)
  @ApiResponse(200, "Excel文件")
  async export(@Req() req: Request, @Res() res: Response) {
    try {
      const query = req.query;
      const where = this.buildWhere(query);
      const logs = await this.repository.findAll(where);

      const data = logs.map((log: any) => ({
        日志ID: log.log_id,
        租户ID: log.tenant_id,
        用户ID: log.user_id || "",
        用户名: log.username || "",
        操作: log.operation,
        方法: log.method,
        请求URL: log.request_url,
        请求参数: log.request_params || "",
        响应数据: log.response_data || "",
        IP地址: log.ip_address,
        用户代理: log.user_agent || "",
        "执行时间(ms)": log.execute_time,
        状态: log.status === 1 ? "成功" : "失败",
        错误信息: log.error_msg || "",
        创建时间: log.created_at.toISOString(),
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "审计日志");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

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

  private buildWhere(query: any) {
    const where: any = {};
    if (query.username) where.username = { contains: query.username };
    if (query.operation) where.operation = { contains: query.operation };
    if (query.method) where.method = query.method.toUpperCase();
    if (query.status !== undefined && query.status !== "")
      where.status = Number(query.status);
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

  private handleError(res: Response, err: any) {
    error(
      res,
      err.message || "操作失败",
      err.code || 500,
      err.statusCode || 500,
    );
  }
}
