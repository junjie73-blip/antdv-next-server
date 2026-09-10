import { BaseController } from "@/core/base-controller.js";
import {
  TenantCreateSchema,
  TenantUpdateSchema,
  TenantListSchema,
} from "./schema.js";
import { TenantRepository } from "./repository.js";
import { Controller } from "@/core/decorator/controller.js";
import { AppError } from "@/middleware/error-handler.js";
import {
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

@Controller("/tenant", { tags: ["租户管理"] })
export default class TenantController extends BaseController<
  any,
  any,
  any,
  any
> {
  protected readonly repository = new TenantRepository();
  protected readonly config = {
    routePrefix: "/api/v1/tenant",
    tags: ["租户管理"],
    permissionPrefix: "tenant",
    enableAudit: true,
    defaultPageSize: 10,
    maxPageSize: 100,
  };
  protected readonly createSchema = TenantCreateSchema;
  protected readonly updateSchema = TenantUpdateSchema;
  protected readonly querySchema = TenantListSchema;

  /**
   * 重写构建查询条件 - 实现租户特有的关键字搜索
   */
  protected buildListWhere(query: any): any {
    const where: any = {};
    if (query.keyword) {
      where.OR = [
        { tenant_code: { contains: query.keyword } },
        { tenant_name: { contains: query.keyword } },
        { contact_name: { contains: query.keyword } },
        { contact_email: { contains: query.keyword } },
        { contact_phone: { contains: query.keyword } },
      ];
    }
    if (query.tenant_code) {
      where.tenant_code = { contains: query.tenant_code };
    }
    if (query.tenant_name) {
      where.tenant_name = { contains: query.tenant_name };
    }
    if (query.status !== undefined) {
      where.status = query.status;
    }
    return where;
  }

  async beforeCreate(dto: any, _req: Request): Promise<any> {
    const bool = await this.repository.codeExists(
      dto.tenantCode,
      _req.tenantId!,
    );
    if (bool) {
      throw new AppError(409, `租户编码 '${dto.tenantCode}' 已存在`, 409);
    }
    if (dto.expireTime !== undefined) {
      dto.expireTime = dto.expireTime ? new Date(dto.expireTime) : null;
    }
    return dto;
  }
  async beforeUpdate(id: string, dto: any, req: Request): Promise<any> {
    dto = await super.beforeUpdate(id, dto, req);
    const repo = this.repository as TenantRepository;

    if (dto.tenantCode) {
      const exist = await repo.findByTenantCode(
        dto.tenantCode,
        req.tenantId!,
        id,
      );
      if (exist) {
        throw new AppError(409, `租户编码 '${dto.tenantCode}' 已存在`, 409);
      }
    }
    return dto;
  }
  /**
   * GET /tenant/list - 分页列表
   */
  @Get("/list")
  @ApiOperation("获取租户分页列表", "支持关键字搜索、状态过滤和分页")
  @ApiQuery(TenantListSchema)
  @ApiResponse(200, "查询成功", {
    type: "object",
    properties: {
      list: { type: "array", items: { $ref: "#/components/schemas/Tenant" } },
      total: { type: "number" },
      pageNum: { type: "number" },
      pageSize: { type: "number" },
      totalPages: { type: "number" },
    },
  })
  @ApiResponse(400, "参数错误")
  @ApiResponse(500, "服务器内部错误")
  async getList(@Req() req: Request, @Res() res: Response) {
    return this.list(req, res);
  }

  /**
   * GET /tenant/:id - 详情
   */
  @Get("/:id")
  @ApiOperation("获取租户详情", "根据租户ID获取详细信息")
  @ApiResponse(200, "查询成功", { $ref: "#/components/schemas/Tenant" })
  @ApiResponse(404, "租户不存在")
  @ApiResponse(400, "参数错误")
  @ApiResponse(500, "服务器内部错误")
  async getDetail(@Req() req: Request, @Res() res: Response) {
    return this.detail(req, res);
  }

  /**
   * POST /tenant - 创建租户
   */
  @Post("/save")
  @ApiOperation("创建租户", "创建新的租户记录")
  @ApiBody(TenantCreateSchema)
  @ApiResponse(200, "创建成功", { $ref: "#/components/schemas/Tenant" })
  @ApiResponse(400, "参数错误")
  @ApiResponse(409, "租户编码已存在")
  @ApiResponse(500, "服务器内部错误")
  async createTenant(@Req() req: Request, @Res() res: Response) {
    return this.create(req, res);
  }

  /**
   * POST /tenant/:id - 更新租户
   */
  @Post("/update/:id")
  @ApiOperation("更新租户", "根据租户ID更新租户信息")
  @ApiBody(TenantUpdateSchema)
  @ApiResponse(200, "更新成功", { $ref: "#/components/schemas/Tenant" })
  @ApiResponse(404, "租户不存在")
  @ApiResponse(400, "参数错误")
  @ApiResponse(500, "服务器内部错误")
  async updateTenant(@Req() req: Request, @Res() res: Response) {
    return this.update(req, res);
  }

  /**
   * GET /tenant/:id - 删除租户（软删除）
   */
  @Get("/remove/:id")
  @ApiOperation("删除租户", "软删除指定租户")
  @ApiResponse(200, "删除成功")
  @ApiResponse(404, "租户不存在")
  @ApiResponse(400, "参数错误")
  @ApiResponse(500, "服务器内部错误")
  async deleteTenant(@Req() req: Request, @Res() res: Response) {
    return this.remove(req, res);
  }

  /**
   * POST /tenant/batch-delete - 批量删除租户
   */
  @Post("/batch-delete")
  @ApiOperation("批量删除租户", "批量软删除租户")
  @ApiBody(
    z.object({
      ids: z.array(z.string().uuid()).min(1),
    }),
  )
  @ApiResponse(200, "批量删除成功", {
    type: "object",
    properties: {
      deletedCount: { type: "number" },
    },
  })
  @ApiResponse(400, "参数错误")
  @ApiResponse(500, "服务器内部错误")
  async batchDeleteTenants(@Req() req: Request, @Res() res: Response) {
    return this.batchRemove(req, res);
  }
}
