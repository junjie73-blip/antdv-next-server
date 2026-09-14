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
import { BaseController } from "@/core/base-controller.js";
import { DictDataRepository } from "./repository.js";
import {
  DictDataCreateSchema,
  DictDataUpdateSchema,
  DictDataListSchema,
  DictTreeQuerySchema,
} from "./schema.js";
import { AppError } from "@/middleware/error-handler.js";
import z from "zod";
import { success } from "@/common/utils/response.js";

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
  async beforeUpdate(id: string, dto: any, req: Request): Promise<any> {
    dto = await super.beforeUpdate(id, dto, req);
    const repo = this.repository as DictDataRepository;

    // 仅当 dictTypeId 和 dictLabel 同时存在时才检查（如果只更新一个字段，需要先获取原记录）
    if (dto.dictTypeId && dto.dictLabel) {
      const exist = await repo.findByLabel(
        dto.dictTypeId,
        dto.dictLabel,
        req.tenantId!,
        id,
      );
      if (exist) {
        throw new AppError(`字典标签 '${dto.dictLabel}' 已存在`, 409, 409);
      }
    }
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
  async beforeCreate(dto: any, req: Request): Promise<any> {
    dto = await super.beforeCreate(dto, req);
    const tenantId = req.tenantId!;
    const existing = await (this.repository as DictDataRepository).findByLabel(
      dto.dictTypeId,
      dto.dictLabel,
      tenantId,
    );
    if (existing) {
      throw new AppError(`字典标签 '${dto.dictLabel}' 已存在`, 409, 409);
    }
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
      const dictTypeId = req.query.dictTypeId as string | undefined;
      const data = await (
        this.repository as DictDataRepository
      ).findByDictCodeAndType(req.params.code, req.tenantId!, dictTypeId);
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
      const { dictTypeId, dictCode } = req.query;
      const tree = await this.repository.findTree(req.tenantId!, {
        dictTypeId: dictTypeId as string | undefined,
        dictCode: dictCode as string | undefined,
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
}
