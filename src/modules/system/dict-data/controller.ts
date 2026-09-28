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
import { DictDataRepository } from "./repository.js";
import {
  DictDataCreateSchema,
  DictDataUpdateSchema,
  DictDataListSchema,
  DictTreeQuerySchema,
} from "./schema.js";
import { AppError } from "@/middleware/http/error-handler.js";
import { z } from "zod";
import { success } from "@/shared/http/response.js";
import { DictService } from "@/core/excel/dict.service.js";
import { DictTypeRepository } from "../dict-type/repository.js";
import { upload } from "../user/controller.js";

@Controller("/dict-data", { tags: ["字典数据"] })
export default class DictDataController extends BaseController<
  any,
  any,
  any,
  any
> {
  protected readonly repository = new DictDataRepository();
  protected readonly config = {
    routePrefix: "/api/v1/dict-data",
    tags: ["字典数据"],
    permissionPrefix: "dictData",
    enableAudit: true,
    defaultPageSize: 10,
    maxPageSize: 100,
  };
  protected readonly createSchema = DictDataCreateSchema;
  protected readonly updateSchema = DictDataUpdateSchema;
  protected readonly querySchema = DictDataListSchema;
  protected readonly service = new DictService(
    new DictTypeRepository(),
    this.repository,
  );
  async beforeUpdate(id: string, dto: any, req: Request): Promise<any> {
    dto = await super.beforeUpdate(id, dto, req);
    await this.service.checkDataBeforeUpdate(id, dto, req.tenantId!);
    return dto;
  }
  // 重写列表查询条件构建
  protected buildListWhere(query: any): any {
    const where: any = {};
    if (query.dictTypeId) {
      where.dict_type_id = query.dictTypeId;
    }
    if (query.keyword) {
      where.OR = [
        { dict_label: { contains: query.keyword } },
        { dict_value: { contains: query.keyword } },
      ];
    }
    if (query.status !== undefined) {
      where.status = query.status;
    }
    return where;
  }
  async beforeCreate(dto: any, req: Request) {
    dto = await super.beforeCreate(dto, req);
    await this.service.checkDataBeforeCreate(dto, req.tenantId!);
    return dto;
  }
  // ============ CRUD 路由 ============
  @Get("/list")
  @ApiOperation("获取字典数据列表")
  @ApiQuery(DictDataListSchema)
  @ApiResponse(200, "查询成功")
  async listDictData(@Req() req: Request, @Res() res: Response) {
    return super.list(req, res);
  }

  @Post("/")
  @ApiOperation("创建字典数据")
  @ApiBody(DictDataCreateSchema)
  @ApiResponse(200, "创建成功")
  async createDictData(@Req() req: Request, @Res() res: Response) {
    return super.create(req, res);
  }

  @Put("/:id")
  @ApiOperation("更新字典数据")
  @ApiBody(DictDataUpdateSchema)
  @ApiResponse(200, "更新成功")
  async updateDictData(@Req() req: Request, @Res() res: Response) {
    return super.update(req, res);
  }

  @Delete("/:id")
  @ApiOperation("删除字典数据")
  @ApiResponse(200, "删除成功")
  async removeDictData(@Req() req: Request, @Res() res: Response) {
    return super.remove(req, res);
  }
  @Get("/by-code/:code")
  @ApiOperation(
    "根据字典编码获取字典数据",
    "可传入可选的dictTypeId参数以精确过滤",
  )
  @ApiQuery(z.object({ dictTypeId: z.string().uuid().optional() }))
  @ApiResponse(200, "查询成功")
  async getByCode(@Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.service.getDataByCode(
        req.params.code,
        req.tenantId!,
        req.query.dictTypeId as string | undefined,
      );
      success(res, data);
    } catch (err) {
      this.handleError(res, err);
    }
  }
  /**
   * 字典树接口
   */
  @Get("/code/tree")
  @ApiOperation("获取字典树", "返回所有启用的字典类型及其字典数据（树形结构）")
  @ApiQuery(DictTreeQuerySchema)
  @ApiResponse(200, "查询成功")
  async dictTree(@Req() req: Request, @Res() res: Response) {
    try {
      const tree = await this.service.getTree(req.tenantId!, {
        dictTypeId: req.query.dictTypeId as string,
        dictCode: req.query.dictCode as string,
      });
      success(res, tree);
    } catch (err) {
      this.handleError(res, err);
    }
  }
  @Get("/:id")
  @ApiOperation("获取字典数据详情")
  @ApiResponse(200, "查询成功")
  async detailDictData(@Req() req: Request, @Res() res: Response) {
    return super.detail(req, res);
  }

  // 批量刪除
  @Post("/batch-remove")
  @ApiBody(z.object({ ids: z.array(z.string().uuid()).min(1) }))
  @ApiOperation("批量删除字典数据")
  @ApiResponse(200, "删除成功")
  async batchRemoveDictData(@Req() req: Request, @Res() res: Response) {
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
