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
import { PermissionRepository } from "./repository.js";
import {
  PermissionCreateSchema,
  PermissionUpdateSchema,
  PermissionListSchema,
} from "./schema.js";
import { AppError } from "@/middleware/error-handler.js";
import { PermissionService } from "./service.js";
import { upload } from "../user/controller.js";
import { success } from "@/common/utils/response.js";

@Controller("/permission", { tags: ["权限管理"] })
export default class PermissionController extends BaseController<
  any,
  any,
  any,
  any
> {
  protected readonly repository = new PermissionRepository();
  protected readonly config = {
    routePrefix: "/api/v1/permission",
    tags: ["权限管理"],
    permissionPrefix: "permission",
    enableAudit: true,
    defaultPageSize: 10,
    maxPageSize: 100,
  };
  protected readonly createSchema = PermissionCreateSchema;
  protected readonly updateSchema = PermissionUpdateSchema;
  protected readonly querySchema = PermissionListSchema;
  protected readonly service = new PermissionService(this.repository);
  // 重写查询条件
  protected buildListWhere(query: any): any {
    const where: any = {};
    if (query.permCode) where.perm_code = { contains: query.permCode };
    if (query.permName) where.perm_name = { contains: query.permName };
    if (query.resourceType) where.resource_type = query.resourceType;
    if (query.status !== undefined) where.status = query.status;
    return where;
  }

  // 创建前唯一性校验
  async beforeCreate(dto: any, req: Request): Promise<any> {
    dto = await super.beforeCreate(dto, req);
    await this.service.checkBeforeCreate(dto, req.tenantId!);
    return dto;
  }

  // 更新前唯一性校验
  async beforeUpdate(id: string, dto: any, req: Request): Promise<any> {
    dto = await super.beforeUpdate(id, dto, req);
    await this.service.checkBeforeUpdate(id, dto, req.tenantId!);
    return dto;
  }

  // ============ CRUD 路由 ============
  @Get("/list")
  @ApiOperation("获取权限列表")
  @ApiQuery(PermissionListSchema)
  @ApiResponse(200, "查询成功")
  async listPermission(@Req() req: Request, @Res() res: Response) {
    return super.list(req, res);
  }

  @Get("/:id")
  @ApiOperation("获取权限详情")
  @ApiResponse(200, "查询成功")
  async getDetail(@Req() req: Request, @Res() res: Response) {
    return super.detail(req, res);
  }

  @Post("/")
  @ApiOperation("创建权限")
  @ApiBody(PermissionCreateSchema)
  @ApiResponse(200, "创建成功")
  async createPermission(@Req() req: Request, @Res() res: Response) {
    return super.create(req, res);
  }

  @Put("/:id")
  @ApiOperation("更新权限")
  @ApiBody(PermissionUpdateSchema)
  @ApiResponse(200, "更新成功")
  async updatePermission(@Req() req: Request, @Res() res: Response) {
    return super.update(req, res);
  }

  @Delete("/:id")
  @ApiOperation("删除权限")
  @ApiResponse(200, "删除成功")
  async removePermission(@Req() req: Request, @Res() res: Response) {
    return super.remove(req, res);
  }
  @Get("/export")
  @ApiOperation("导出权限")
  async export(@Req() req: Request, @Res() res: Response) {
    const buffer = await this.service.exportToExcel(req.tenantId!);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=permissions_${Date.now()}.xlsx`,
    );
    res.send(buffer);
  }

  @Post("/import")
  @ApiOperation("导入权限")
  async import(@Req() req: Request, @Res() res: Response) {
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
