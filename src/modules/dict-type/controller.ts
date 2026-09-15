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
import { BaseController } from "@/core/base/controller.js";
import { DictTypeRepository } from "./repository.js";
import {
  DictTypeCreateSchema,
  DictTypeUpdateSchema,
  DictTypeListSchema,
} from "./schema.js";
import { AppError } from "@/middleware/error-handler.js";
import { z } from "zod";
import { upload } from "../user/controller.js";
import { DictService } from "@/core/excel/dict.service.js";
import { DictDataRepository } from "../dict-data/repository.js";
import { success } from "@/common/utils/response.js";

@Controller("/dict-type", { tags: ["字典类型"] })
export default class DictTypeController extends BaseController<
  any,
  any,
  any,
  any
> {
  protected readonly repository = new DictTypeRepository();
  protected readonly config = {
    routePrefix: "/api/v1/dict-type",
    tags: ["字典类型"],
    permissionPrefix: "dictType",
    enableAudit: true,
    defaultPageSize: 10,
    maxPageSize: 100,
  };
  protected readonly createSchema = DictTypeCreateSchema;
  protected readonly updateSchema = DictTypeUpdateSchema;
  protected readonly querySchema = DictTypeListSchema;
  protected readonly service = new DictService(
    this.repository,
    new DictDataRepository(),
  );
  async beforeCreate(dto: any, req: Request) {
    dto = await super.beforeCreate(dto, req);
    await this.service.checkTypeBeforeCreate(dto, req.tenantId!);
    return dto;
  }

  async beforeUpdate(id: string, dto: any, req: Request) {
    dto = await super.beforeUpdate(id, dto, req);
    await this.service.checkTypeBeforeUpdate(id, dto, req.tenantId!);
    return dto;
  }
  // 重写列表查询条件构建（由基类调用）
  protected buildListWhere(query: any): any {
    const where: any = {};
    if (query.keyword) {
      where.OR = [
        { dict_code: { contains: query.keyword } },
        { dict_name: { contains: query.keyword } },
      ];
    }
    if (query.status !== undefined) {
      where.status = query.status;
    }
    return where;
  }

  // ============ CRUD 路由 ============
  @Get("/list")
  @ApiOperation("获取字典类型列表")
  @ApiQuery(DictTypeListSchema)
  @ApiResponse(200, "查询成功")
  async listDictType(@Req() req: Request, @Res() res: Response) {
    return super.list(req, res);
  }

  @Get("/:id")
  @ApiOperation("获取字典类型详情")
  @ApiResponse(200, "查询成功")
  async detailDictType(@Req() req: Request, @Res() res: Response) {
    return super.detail(req, res);
  }

  @Post("/")
  @ApiOperation("创建字典类型")
  @ApiBody(DictTypeCreateSchema)
  @ApiResponse(200, "创建成功")
  async createDictType(@Req() req: Request, @Res() res: Response) {
    return super.create(req, res);
  }

  @Put("/:id")
  @ApiOperation("更新字典类型")
  @ApiBody(DictTypeUpdateSchema)
  @ApiResponse(200, "更新成功")
  async updateDictType(@Req() req: Request, @Res() res: Response) {
    return super.update(req, res);
  }

  @Delete("/:id")
  @ApiOperation("删除字典类型", "存在字典数据时禁止删除")
  @ApiResponse(200, "删除成功")
  async removeDictType(@Req() req: Request, @Res() res: Response) {
    return super.remove(req, res);
  }
  // 批量刪除
  @Post("/batch-remove")
  @ApiBody(z.object({ ids: z.array(z.string().uuid()).min(1) }))
  @ApiOperation("批量删除字典类型")
  @ApiResponse(200, "删除成功")
  async batchRemoveDictType(@Req() req: Request, @Res() res: Response) {
    return this.batchRemove(req, res);
  }
  @Get("/export")
  async export(@Req() req, @Res() res) {
    const buffer = await this.service.exportToExcel(req.tenantId!);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=dict_${Date.now()}.xlsx`,
    );
    res.send(buffer);
  }

  @Post("/import")
  async import(@Req() req, @Res() res) {
    upload.single("file")(req, res, async (err) => {
      if (err)
        return this.handleError(res, new AppError("文件上传失败", 400001, 400));
      if (!req.file)
        return this.handleError(res, new AppError("请上传 Excel", 400001, 400));
      const result = await this.service.importFromExcel(
        req.file.buffer,
        req.tenantId!,
        req.user?.userId,
      );
      success(res, result, "导入完成");
    });
  }
}
