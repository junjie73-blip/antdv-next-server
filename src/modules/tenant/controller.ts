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
import { TenantRepository } from "./repository.js";
import { TenantService } from "./service.js";
import {
  TenantCreateSchema,
  TenantUpdateSchema,
  TenantListSchema,
} from "./schema.js";
import { AppError } from "@/core/errors.js";
import { success } from "@/common/utils/response.js";
import { upload } from "../user/controller.js";

@Controller("/tenant", { tags: ["租户管理"] })
export default class TenantController extends BaseController<
  any,
  any,
  any,
  any
> {
  protected readonly repository = new TenantRepository();
  protected readonly service = new TenantService(this.repository); // ⭐
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

  // ============================================================
  // 查询条件
  // ============================================================

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
    if (query.status !== undefined && query.status !== "") {
      where.status = query.status;
    }
    return where;
  }

  // ============================================================
  // 钩子
  // ============================================================

  async beforeCreate(dto: any, req: Request): Promise<any> {
    dto = await super.beforeCreate(dto, req);
    await this.service.checkBeforeCreate(dto);
    if (dto.expireTime !== undefined) {
      dto.expireTime = dto.expireTime ? new Date(dto.expireTime) : null;
    }
    return dto;
  }

  async beforeUpdate(id: string, dto: any, req: Request): Promise<any> {
    dto = await super.beforeUpdate(id, dto, req);
    await this.service.checkBeforeUpdate(id, dto);
    return dto;
  }

  // ============================================================
  // ⭐ 新增：租户下拉选项
  // ============================================================

  @Get("/options")
  @ApiOperation(
    "获取租户下拉选项",
    "返回所有启用租户的 { tenantId, tenantCode, tenantName }，用于前端下拉选择",
  )
  @ApiResponse(200, "查询成功")
  async getOptions(@Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.service.getOptions();
      success(res, data, "查询成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  // ============================================================
  // CRUD
  // ============================================================

  @Get("/list")
  @ApiOperation("获取租户分页列表")
  @ApiQuery(TenantListSchema)
  @ApiResponse(200, "查询成功")
  async getList(@Req() req: Request, @Res() res: Response) {
    return super.list(req, res);
  }

  @Get("/:id")
  @ApiOperation("获取租户详情")
  @ApiResponse(200, "查询成功")
  async getDetail(@Req() req: Request, @Res() res: Response) {
    return super.detail(req, res);
  }

  @Post("/save")
  @ApiOperation("创建租户")
  @ApiBody(TenantCreateSchema)
  @ApiResponse(200, "创建成功")
  async createTenant(@Req() req: Request, @Res() res: Response) {
    return super.create(req, res);
  }

  @Post("/update/:id")
  @ApiOperation("更新租户")
  @ApiBody(TenantUpdateSchema)
  @ApiResponse(200, "更新成功")
  async updateTenant(@Req() req: Request, @Res() res: Response) {
    return super.update(req, res);
  }

  @Delete("/:id")
  @ApiOperation("删除租户")
  @ApiResponse(200, "删除成功")
  async deleteTenant(@Req() req: Request, @Res() res: Response) {
    return super.remove(req, res);
  }

  @Post("/batch-delete")
  @ApiOperation("批量删除租户")
  @ApiBody(z.object({ ids: z.array(z.string().uuid()).min(1) }))
  @ApiResponse(200, "批量删除成功")
  async batchDeleteTenants(@Req() req: Request, @Res() res: Response) {
    return super.batchRemove(req, res);
  }

  // ============================================================
  // 导入导出
  // ============================================================

  @Get("/export")
  @ApiOperation("导出租户")
  @ApiResponse(200, "Excel 文件")
  async export(@Req() req: Request, @Res() res: Response) {
    try {
      const where = this.buildListWhere(req.query);
      const buffer = await this.service.exportToExcel(where);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=tenants_${Date.now()}.xlsx`,
      );
      res.send(buffer);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/import")
  @ApiOperation("导入租户")
  @ApiResponse(200, "导入结果")
  async import(@Req() req: Request, @Res() res: Response) {
    upload.single("file")(req, res, async (err) => {
      if (err) {
        return this.handleError(res, new AppError("文件上传失败", 400001, 400));
      }
      if (!req.file) {
        return this.handleError(res, new AppError("请上传 Excel", 400001, 400));
      }
      try {
        const result = await this.service.importFromExcel(req.file.buffer);
        success(res, result, "导入完成");
      } catch (err) {
        this.handleError(res, err);
      }
    });
  }
}
