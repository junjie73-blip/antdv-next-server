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
import { ConfigRepository } from "./repository.js";
import {
  ConfigCreateSchema,
  ConfigUpdateSchema,
  ConfigListSchema,
} from "./schema.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import { AppError } from "@/middleware/error-handler.js";
import { z } from "zod";
import { success } from "@/common/utils/response.js";
import { ConfigService } from "./service.js";

@Controller("/config", { tags: ["系统配置"] })
export default class ConfigController extends BaseController<
  any,
  any,
  any,
  any
> {
  protected readonly repository = new ConfigRepository();
  protected readonly config = {
    routePrefix: "/api/v1/config",
    tags: ["系统配置"],
    permissionPrefix: "config",
    enableAudit: true,
    defaultPageSize: 10,
    maxPageSize: 100,
  };
  protected readonly createSchema = ConfigCreateSchema;
  protected readonly updateSchema = ConfigUpdateSchema;
  protected readonly querySchema = ConfigListSchema;
  protected readonly service = new ConfigService(this.repository);
  protected buildListWhere(query: any): any {
    const where: any = {};
    if (query.keyword) {
      where.OR = [
        { config_key: { contains: query.keyword } },
        { description: { contains: query.keyword } },
      ];
    }
    return where;
  }

  // 钩子：唯一性检查
  async beforeCreate(dto: any, req: Request): Promise<any> {
    dto = await super.beforeCreate(dto, req);
    await this.service.checkBeforeCreate(dto, req.tenantId!);
    return dto;
  }

  async beforeUpdate(id: string, dto: any, req: Request): Promise<any> {
    dto = await super.beforeUpdate(id, dto, req);
    await this.service.checkBeforeUpdate(dto, req.tenantId!, id);
    return dto;
  }

  // 额外接口：根据 key 获取配置值（公开或需权限，这里加权限）
  @Get("/value/:key")
  @ApiOperation("根据键获取配置值")
  @ApiResponse(200, "查询成功")
  async getValue(@Req() req: Request, @Res() res: Response) {
    try {
      const value = await this.service.getByKey(req.params.key, req.tenantId!);
      success(res, value);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  // CRUD 路由
  @Get("/list")
  @ApiOperation("获取配置列表")
  @ApiQuery(ConfigListSchema)
  @ApiResponse(200, "查询成功")
  async pageList(@Req() req: Request, @Res() res: Response) {
    return this.list(req, res);
  }

  @Get("/:id")
  @ApiOperation("获取配置详情")
  @ApiResponse(200, "查询成功")
  async getConfigDetail(@Req() req: Request, @Res() res: Response) {
    return super.detail(req, res);
  }

  @Post("/")
  @ApiOperation("创建配置")
  @ApiBody(ConfigCreateSchema)
  @ApiResponse(200, "创建成功")
  async createConfig(@Req() req: Request, @Res() res: Response) {
    return super.create(req, res);
  }

  @Put("/:id")
  @ApiOperation("更新配置")
  @ApiBody(ConfigUpdateSchema)
  @ApiResponse(200, "更新成功")
  async updateConfig(@Req() req: Request, @Res() res: Response) {
    return super.update(req, res);
  }

  @Delete("/:id")
  @ApiOperation("删除配置")
  @ApiResponse(200, "删除成功")
  async removeConfig(@Req() req: Request, @Res() res: Response) {
    return super.remove(req, res);
  }
  @Post("/batch-delete")
  @ApiOperation("批量删除配置")
  @ApiBody(z.object({ ids: z.array(z.string().uuid()) }))
  @ApiResponse(200, "批量删除成功")
  async batchDeleteConfig(@Req() req: Request, @Res() res: Response) {
    return super.batchRemove(req, res);
  }
}
