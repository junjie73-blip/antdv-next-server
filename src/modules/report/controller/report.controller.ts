import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Req,
  Res,
  ApiOperation,
  ApiBody,
  ApiQuery,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { success, pageSuccess } from "@/shared/http/response.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import { RpReportService } from "../service/report.service.js";
import { RpExportTaskService } from "../service/export-task.service.js";
import {
  ReportCreateSchema,
  ReportUpdateSchema,
  ReportListSchema,
  ReportExecuteSchema,
  ReportExportSchema,
  ReportLogListSchema,
} from "../schema.js";
import { RpReportLogRepository } from "../repository/report-log.repository.js";
import {
  ExcelExporter,
  CsvExporter,
  HtmlExporter,
  PdfExporter,
} from "../exporters/index.js";

interface AuthUser {
  userId: string;
  tenantId: string;
  username: string;
  deptId?: string | null;
  roles?: string[];
}

const EXPORT_CONTENT_TYPES: Record<string, string> = {
  excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv; charset=utf-8",
  html: "text/html; charset=utf-8",
  pdf: "application/pdf",
};

const EXPORT_EXTENSIONS: Record<string, string> = {
  excel: "xlsx",
  csv: "csv",
  html: "html",
  pdf: "pdf",
};

@Controller("/report", { tags: ["报表"] })
export default class ReportController {
  private service = new RpReportService();
  private exportTaskService = new RpExportTaskService();
  private logRepo = new RpReportLogRepository();

  /* ============================================================
   * 报表 CRUD
   * ============================================================ */

  @Get("/list")
  @ApiOperation("报表列表")
  @ApiQuery(ReportListSchema)
  async list(@Req() req: Request, @Res() res: Response) {
    const { tenantId, userId } = req.user as AuthUser;
    const dto = ReportListSchema.parse(req.query);

    const result = await this.service.list({
      tenantId,
      userId,
      keyword: dto.keyword,
      category: dto.category,
      pageNum: dto.pageNum,
      pageSize: dto.pageSize,
    });

    return pageSuccess(
      res,
      result.list,
      result.total,
      dto.pageNum,
      dto.pageSize,
    );
  }

  @Get("/:id")
  @ApiOperation("报表详情")
  async detail(@Req() req: Request, @Res() res: Response) {
    const { tenantId } = req.user as AuthUser;
    // 支持按 code 或 id 查询
    const param = req.params.id;
    const data = await this.service
      .detailByCode(param, tenantId)
      .catch(() => this.service.detail(param, tenantId));
    return success(res, data);
  }

  @Post("/")
  @ApiOperation("创建报表")
  @ApiBody(ReportCreateSchema)
  async create(@Req() req: Request, @Res() res: Response) {
    const { userId, tenantId } = req.user as AuthUser;
    const dto = ReportCreateSchema.parse(req.body);
    const created = await this.service.create(dto, tenantId, userId);
    return success(res, created, "创建成功");
  }

  @Put("/:id")
  @ApiOperation("更新报表")
  @ApiBody(ReportUpdateSchema)
  async update(@Req() req: Request, @Res() res: Response) {
    const { userId, tenantId } = req.user as AuthUser;
    const dto = ReportUpdateSchema.parse(req.body);
    await this.service.update(req.params.id, dto, tenantId, userId);
    return success(res, null, "更新成功");
  }

  @Delete("/:id")
  @ApiOperation("删除报表")
  async remove(@Req() req: Request, @Res() res: Response) {
    const { userId, tenantId } = req.user as AuthUser;
    await this.service.remove(req.params.id, tenantId, userId);
    return success(res, null, "删除成功");
  }

  /* ============================================================
   * 执行
   * ============================================================ */

  @Post("/:code/execute")
  @ApiOperation("执行报表")
  @ApiBody(ReportExecuteSchema)
  async execute(@Req() req: Request, @Res() res: Response) {
    const user = req.user as AuthUser;
    const { code } = req.params;
    const dto = ReportExecuteSchema.parse(req.body);

    const result = await this.service.execute({
      reportCode: code,
      tenantId: user.tenantId,
      userId: user.userId,
      username: user.username,
      deptId: user.deptId,
      roles: user.roles,
      input: dto.params,
      useCache: dto.useCache,
    });

    return success(res, result);
  }

  /* ============================================================
   * 导出（同步 / 异步）
   * ============================================================ */

  @Post("/:code/export/:type")
  @ApiOperation("导出报表")
  @ApiBody(ReportExportSchema)
  async export(@Req() req: Request, @Res() res: Response) {
    const user = req.user as AuthUser;
    const { code, type } = req.params;
    const dto = ReportExportSchema.parse(req.body);

    // 校验类型
    if (!["excel", "csv", "html", "pdf"].includes(type)) {
      return res
        .status(400)
        .json({ code: 400001, message: "不支持的导出类型" });
    }

    // ⭐ 异步导出
    if (dto.async) {
      const task = await this.exportTaskService.create({
        tenantId: user.tenantId,
        userId: user.userId,
        reportCode: code,
        exportType: type as any,
        input: dto.params,
        filename: dto.filename,
      });
      return success(res, { taskId: task.task_id }, "导出任务已提交");
    }

    // ⭐ 同步导出
    const start = Date.now();
    try {
      const result = await this.service.execute({
        reportCode: code,
        tenantId: user.tenantId,
        userId: user.userId,
        username: user.username,
        deptId: user.deptId,
        roles: user.roles,
        input: dto.params,
        useCache: false,
      });

      const buffer = await this.buildFile(type, result);

      // 日志
      await this.logRepo.create({
        tenant_id: user.tenantId,
        report_id: result.reportId,
        report_code: code,
        row_count: result.total,
        duration_ms: Date.now() - start,
        status: "1",
        export_type: type,
        created_by: user.userId,
      });

      // 响应
      const ext = EXPORT_EXTENSIONS[type];
      const filename = encodeURIComponent(
        dto.filename ?? `${result.reportName}_${Date.now()}.${ext}`,
      );
      res.setHeader("Content-Type", EXPORT_CONTENT_TYPES[type]);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename*=UTF-8''${filename}`,
      );
      res.send(buffer);
    } catch (err: any) {
      // 失败日志
      await this.logRepo
        .create({
          tenant_id: user.tenantId,
          report_id: code,
          report_code: code,
          row_count: 0,
          duration_ms: Date.now() - start,
          status: "0",
          error_msg: err.message,
          export_type: type,
          created_by: user.userId,
        })
        .catch(() => undefined);
      throw err;
    }
  }

  /* ============================================================
   * 收藏
   * ============================================================ */

  @Post("/:id/favorite")
  @ApiOperation("收藏/取消收藏")
  async toggleFavorite(@Req() req: Request, @Res() res: Response) {
    const { userId, tenantId } = req.user as AuthUser;
    const result = await this.service.toggleFavorite(
      req.params.id,
      tenantId,
      userId,
    );
    return success(res, result, result.isFavorite ? "已收藏" : "已取消");
  }

  /* ============================================================
   * 日志
   * ============================================================ */

  @Get("/logs/list")
  @ApiOperation("执行日志")
  @ApiQuery(ReportLogListSchema)
  async logs(@Req() req: Request, @Res() res: Response) {
    const { tenantId } = req.user as AuthUser;
    const dto = ReportLogListSchema.parse(req.query);

    const result = await this.logRepo.findPage(
      {
        tenantId,
        reportCode: dto.reportCode,
        exportType: dto.exportType,
        status: dto.status,
        pageNum: dto.pageNum,
        pageSize: dto.pageSize,
      },
      {},
    );

    return pageSuccess(
      res,
      result.list,
      result.total,
      dto.pageNum,
      dto.pageSize,
    );
  }

  /* ============================================================
   * 清缓存
   * ============================================================ */

  @Post("/:code/clear-cache")
  @ApiOperation("清除报表缓存")
  async clearCache(@Req() req: Request, @Res() res: Response) {
    const { tenantId } = req.user as AuthUser;
    await this.service.clearCache(req.params.code, tenantId);
    return success(res, null, "缓存已清除");
  }

  /* ============================================================
   * 内部：构造导出文件
   * ============================================================ */
  private async buildFile(type: string, result: any): Promise<Buffer> {
    switch (type) {
      case "excel":
        return ExcelExporter.export({
          title: result.reportName,
          sheetName: result.reportName,
          columns: result.columns,
          rows: result.rows,
          summary: result.summary,
        });

      case "csv":
        return Buffer.from(
          CsvExporter.export({
            columns: result.columns,
            rows: result.rows,
          }),
          "utf-8",
        );

      case "html":
        return Buffer.from(
          HtmlExporter.export({
            title: result.reportName,
            columns: result.columns,
            rows: result.rows,
            summary: result.summary,
          }),
          "utf-8",
        );

      case "pdf":
        return PdfExporter.export({
          title: result.reportName,
          columns: result.columns,
          rows: result.rows,
          summary: result.summary,
          fontPath: process.env.PDF_FONT_PATH,
        });

      default:
        throw new Error(`不支持的导出类型：${type}`);
    }
  }
}
