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
  ApiResponse,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { z } from "zod";
import { BaseController } from "@/core/base/controller.js";
import { NotFoundError } from "@/core/errors.js";
import { success } from "@/common/utils/response.js";
import { logger } from "@/core/logger/index.js";
import { GenTableRepository } from "./repository.js";
import { GenTableService } from "./service.js";
import {
  GenTableCreateSchema,
  GenTableListSchema,
  GenTableUpdateSchema,
} from "./schema.js";
@Controller("/generator", { tags: ["代码生成器"] })
export default class GenTableController extends BaseController<
  any,
  any,
  any,
  any
> {
  protected readonly repository = new GenTableRepository();
  protected readonly service = new GenTableService(this.repository);

  protected readonly config = {
    routePrefix: "/api/v1/generator",
    tags: ["代码生成器"],
    permissionPrefix: "tool:gen",
    enableAudit: true,
    defaultPageSize: 10,
    maxPageSize: 100,
  };

  protected readonly createSchema = GenTableCreateSchema;
  protected readonly updateSchema = GenTableUpdateSchema;
  protected readonly querySchema = GenTableListSchema;

  protected buildListWhere(query: {
    keyword?: string;
  }): Record<string, unknown> {
    const where: Record<string, unknown> = {};
    if (query.keyword) {
      where.OR = [
        { table_name: { contains: query.keyword } },
        { table_comment: { contains: query.keyword } },
      ];
    }
    return where;
  }

  // ============================================================
  // CRUD
  // ============================================================

  @Get("/list")
  @ApiOperation("获取生成表列表")
  @ApiQuery(GenTableListSchema)
  @ApiResponse(200, "查询成功")
  async pageListCode(@Req() req: Request, @Res() res: Response) {
    return this.list(req, res);
  }

  @Get("/:id")
  @ApiOperation("获取生成表详情（含字段）")
  @ApiResponse(200, "查询成功")
  async detailCode(@Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.repository.findWithColumns(
        req.params.id,
        req.tenantId!,
      );
      success(res, data);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/")
  @ApiOperation("新增（建表 + 存元数据）")
  @ApiBody(GenTableCreateSchema)
  @ApiResponse(200, "建表成功")
  async createCode(@Req() req: Request, @Res() res: Response) {
    try {
      const dto = GenTableCreateSchema.parse(req.body);
      const result = await this.service.createWithTable(
        dto,
        req.tenantId!,
        req.user?.userId,
      );
      success(res, result, "建表成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Put("/:id")
  @ApiOperation("更新元数据（不执行 ALTER）")
  @ApiBody(GenTableUpdateSchema)
  @ApiResponse(200, "更新成功")
  async updateCode(@Req() req: Request, @Res() res: Response) {
    try {
      const dto = GenTableUpdateSchema.parse(req.body);
      await this.service.updateMetadata(
        req.params.id,
        dto,
        req.tenantId!,
        req.user?.userId,
      );
      success(res, null, "更新成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Delete("/:id")
  @ApiOperation("删除配置（不删除数据库表）")
  @ApiResponse(200, "删除成功")
  async removeCode(@Req() req: Request, @Res() res: Response) {
    try {
      await this.repository.softDeleteTable(
        req.params.id,
        req.tenantId!,
        req.user?.userId,
      );
      success(res, null, "删除成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  // ============================================================
  // 生成
  // ============================================================

  @Get("/:id/preview/:template")
  @ApiOperation("预览生成的代码")
  @ApiResponse(200, "查询成功")
  async previewCode(@Req() req: Request, @Res() res: Response) {
    try {
      const code = await this.service.preview(
        req.params.id,
        req.tenantId!,
        req.params.template,
      );
      success(res, { code });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/:id/download")
  @ApiOperation("下载生成的代码 zip")
  @ApiResponse(200, "下载成功")
  async downloadCode(@Req() req: Request, @Res() res: Response) {
    try {
      const table = await this.repository.findWithColumns(
        req.params.id,
        req.tenantId!,
      );
      if (!table) throw new NotFoundError("生成表不存在");

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${table.table_name}.zip"`,
      );
      res.setHeader("Content-Type", "application/zip");

      await this.service.downloadZip(req.params.id, req.tenantId!, res);
    } catch (err) {
      logger.error(
        { err, tableId: req.params.id },
        "[generator] download failed",
      );
      if (!res.headersSent) this.handleError(res, err);
      else res.end();
    }
  }
}
