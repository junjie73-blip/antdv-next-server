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
import { DictTypeRepository } from "./repository.js";
import {
  DictTypeCreateSchema,
  DictTypeUpdateSchema,
  DictTypeListSchema,
} from "./schema.js";
import { AppError } from "@/middleware/error-handler.js";
import z from "zod";

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
  async beforeUpdate(id: string, dto: any, req: Request): Promise<any> {
    dto = await super.beforeUpdate(id, dto, req);
    const repo = this.repository as DictTypeRepository;

    if (dto.dictCode) {
      const exist = await repo.findByDictCode(dto.dictCode, req.tenantId!, id);
      if (exist) {
        throw new AppError(409, `字典编码 '${dto.dictCode}' 已存在`, 409);
      }
    }
    return dto;
  }
  async beforeCreate(dto: any, req: Request): Promise<any> {
    dto = await super.beforeCreate(dto, req);
    const tenantId = req.tenantId!;
    const existing = await (
      this.repository as DictTypeRepository
    ).findByDictCode(dto.dictCode, tenantId);
    if (existing) {
      throw new AppError(409, `字典编码 '${dto.dictCode}' 已存在`, 409);
    }
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
}
