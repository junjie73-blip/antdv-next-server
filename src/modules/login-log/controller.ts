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
import { LoginLogRepository } from "./repository.js";
import { LoginLogListSchema, LoginLogExportSchema } from "./schema.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import { success, error } from "@/common/utils/response.js";
import * as XLSX from "xlsx";
import dayjs from "dayjs";

@Controller("/login-log", { tags: ["登录日志"] })
export default class LoginLogController {
  private repository = new LoginLogRepository();

  @Get("/list")
  @ApiOperation("获取登录日志列表")
  @ApiQuery(LoginLogListSchema)
  @ApiResponse(200, "查询成功")
  async listLoginLog(@Req() req: Request, @Res() res: Response) {
    try {
      const query = {
        tenantId: req.tenantId!,
        username: req.query.username as string,
        status: req.query.status,
        startTime: req.query.startTime as string,
        endTime: req.query.endTime as string,
      } as any;
      const where = this.buildWhere(query);
      const data = await this.repository.findPage(query, where);
      data.list = data.list.map((item: any) => ({
        ...item,
        created_at: dayjs(item.created_at).format("YYYY-MM-DD HH:mm:ss"),
      }));
      success(res, data);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/export")
  @ApiOperation("导出登录日志")
  @ApiQuery(LoginLogExportSchema)
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
        用户名: log.username,
        IP地址: log.ip_address,
        用户代理: log.user_agent || "",
        状态: log.status === 1 ? "成功" : "失败",
        消息: log.message || "",
        创建时间: dayjs(log.created_at).format("YYYY-MM-DD HH:mm:ss"),
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "登录日志");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

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

  private buildWhere(query: any) {
    const where: any = {};
    if (query.username) where.username = { contains: query.username };
    if (query.status !== undefined) {
      where.status = query.status;
    }
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
