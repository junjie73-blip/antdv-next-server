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
import { DeptRepository } from "./repository.js";
import {
  DeptCreateSchema,
  DeptUpdateSchema,
  DeptListSchema,
} from "./schema.js";
import { AppError } from "@/middleware/error-handler.js";
import { success } from "@/common/utils/response.js";
import z from "zod";

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

  protected buildListWhere(query: any) {
    const where: any = {};
    if (query.deptName) where.dept_name = { contains: query.deptName };
    if (query.status !== undefined && query.status !== "")
      where.status = Number(query.status);
    return where;
  }

  // 创建前唯一性检查
  async beforeCreate(dto: any, req: Request): Promise<any> {
    dto = await super.beforeCreate(dto, req);
    const repo = this.repository as DeptRepository;
    const exist = await repo.findByDeptCode(dto.deptCode, req.tenantId!);
    if (exist)
      throw new AppError(409, `部门编码 '${dto.deptCode}' 已存在`, 409);
    return dto;
  }

  // 更新前唯一性检查
  async beforeUpdate(id: string, dto: any, req: Request): Promise<any> {
    dto = await super.beforeUpdate(id, dto, req);
    const repo = this.repository as DeptRepository;
    if (dto.deptCode) {
      const exist = await repo.findByDeptCode(dto.deptCode, req.tenantId!, id);
      if (exist)
        throw new AppError(409, `部门编码 '${dto.deptCode}' 已存在`, 409);
    }
    return dto;
  }

  // 树查询
  @Get("/tree")
  @ApiOperation("获取部门树", "返回树形结构部门")
  @ApiResponse(200, "查询成功")
  async tree(@Req() req: Request, @Res() res: Response) {
    try {
      const data = await (this.repository as DeptRepository).findTree(
        req.tenantId!,
      );
      success(res, data, "获取部门树成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  // CRUD 路由
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
      await (this.repository as DeptRepository).updateDeptUsers(
        req.params.id,
        userIds,
        req.tenantId!,
      );
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
      const users = await (this.repository as DeptRepository).findDeptUsers(
        req.params.id,
        req.tenantId!,
      );
      success(res, users, "查询成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }
}
