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
import { DeptRepository } from "./repository.js";
import {
  DeptCreateSchema,
  DeptUpdateSchema,
  DeptListSchema,
} from "./schema.js";
import { AppError } from "@/core/errors.js";
import { success } from "@/shared/http/response.js";
import { z } from "zod";
import { DeptService } from "./service.js";
import { upload } from "../user/controller.js";

@Controller("/dept", { tags: ["部门管理"] })
export default class DeptController extends BaseController<any, any, any, any> {
  protected readonly repository = new DeptRepository();
  protected readonly config = {
    routePrefix: "/api/v1/dept",
    tags: ["部门管理"],
    permissionPrefix: "dept",
    enableAudit: true,
    defaultPageSize: 10,
    maxPageSize: 100,
  };
  protected readonly createSchema = DeptCreateSchema;
  protected readonly updateSchema = DeptUpdateSchema;
  protected readonly querySchema = DeptListSchema;
  protected readonly service = new DeptService(this.repository);

  protected buildListWhere(query: any) {
    const where: any = {};
    if (query.deptName) where.dept_name = { contains: query.deptName };
    if (query.status !== undefined) where.status = query.status;
    if (query.parentId) where.parent_id = query.parentId;
    return where;
  }

  async beforeCreate(dto: any, req: Request) {
    dto = await super.beforeCreate(dto, req);
    await this.service.checkBeforeCreate(dto, req.tenantId!);
    return dto;
  }

  async beforeUpdate(id: string, dto: any, req: Request) {
    dto = await super.beforeUpdate(id, dto, req);
    await this.service.checkBeforeUpdate(id, dto, req.tenantId!);
    return dto;
  }

  @Get("/tree")
  @ApiQuery(
    z.object({
      onlyEnabled: z.string().optional().openapi({
        description: "为 '1' 时只返回 status='1' 的部门",
      }),
    }),
  )
  @ApiOperation("获取部门树", "返回树形结构部门")
  @ApiResponse(200, "查询成功")
  async tree(@Req() req: Request, @Res() res: Response) {
    try {
      const onlyEnabled = req.query.onlyEnabled === "1";
      const data = await this.service.getTree(req.tenantId!, { onlyEnabled });
      success(res, data, "获取部门树成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/list")
  @ApiOperation("获取部门列表", "平铺列表")
  @ApiQuery(DeptListSchema)
  @ApiResponse(200, "查询成功")
  async listDept(@Req() req: Request, @Res() res: Response) {
    return super.list(req, res);
  }

  @Get("/:id")
  @ApiOperation("获取部门详情")
  @ApiResponse(200, "查询成功")
  async getDetailDept(@Req() req: Request, @Res() res: Response) {
    return super.detail(req, res);
  }

  @Post("/")
  @ApiOperation("创建部门")
  @ApiBody(DeptCreateSchema)
  @ApiResponse(200, "创建成功")
  async createDept(@Req() req: Request, @Res() res: Response) {
    return super.create(req, res);
  }

  @Put("/:id")
  @ApiOperation("更新部门")
  @ApiBody(DeptUpdateSchema)
  @ApiResponse(200, "更新成功")
  async updateDept(@Req() req: Request, @Res() res: Response) {
    return super.update(req, res);
  }

  @Delete("/:id")
  @ApiOperation("删除部门", "存在子部门或关联用户时禁止删除")
  @ApiResponse(200, "删除成功")
  async removeDept(@Req() req: Request, @Res() res: Response) {
    return super.remove(req, res);
  }

  @Put("/:id/users")
  @ApiOperation("更新部门用户", "批量设置部门下的用户列表")
  @ApiBody(z.object({ userIds: z.array(z.string().uuid()) }))
  @ApiResponse(200, "更新成功")
  async updateDeptUsers(@Req() req: Request, @Res() res: Response) {
    try {
      const { userIds } = req.body;
      await this.service.updateDeptUsers(req.params.id, userIds, req.tenantId!);
      success(res, null, "更新成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/:id/users")
  @ApiOperation("获取部门用户", "获取部门关联的用户列表")
  @ApiResponse(200, "查询成功")
  async getDeptUsers(@Req() req: Request, @Res() res: Response) {
    try {
      const users = await this.service.getDeptUsers(
        req.params.id,
        req.tenantId!,
      );
      success(res, users, "查询成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/export")
  async exportDepts(@Req() req: Request, @Res() res: Response) {
    const buffer = await this.service.exportToExcel(req.tenantId!);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=depts_${Date.now()}.xlsx`,
    );
    res.send(buffer);
  }

  @Post("/import")
  async importDepts(@Req() req: Request, @Res() res: Response) {
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
