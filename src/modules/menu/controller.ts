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
import { MenuRepository } from "./repository.js";
import {
  MenuCreateSchema,
  MenuUpdateSchema,
  MenuListSchema,
} from "./schema.js";
import { AppError } from "@/middleware/error-handler.js";
import { success } from "@/common/utils/response.js";
import z from "zod";

@Controller("/menu", { tags: ["菜单管理"] })
export default class MenuController extends BaseController<any, any, any, any> {
  protected readonly repository = new MenuRepository();
  protected readonly config = {
    routePrefix: "/api/v1/menu",
    tags: ["菜单管理"],
    permissionPrefix: "menu",
    enableAudit: true,
    defaultPageSize: 10,
    maxPageSize: 100,
  };
  protected readonly createSchema = MenuCreateSchema;
  protected readonly updateSchema = MenuUpdateSchema;
  protected readonly querySchema = MenuListSchema;

  // 重写查询条件
  protected buildListWhere(query: any): any {
    const where: any = {};
    if (query.menuName) where.menu_name = { contains: query.menuName };
    if (query.status !== undefined) where.status = query.status;
    return where;
  }

  // ============ 自定义路由：菜单树 ============
  @Get("/tree")
  @ApiOperation("获取菜单树", "返回树形结构菜单")
  @ApiResponse(200, "查询成功")
  async tree(@Req() req: Request, @Res() res: Response) {
    try {
      const data = await (this.repository as MenuRepository).findTree(
        req.tenantId!,
      );
      success(res, data, "查询成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }
  async beforeCreate(dto: any, req: Request): Promise<any> {
    dto = await super.beforeCreate(dto, req);
    const tenantId = req.tenantId!;
    const repo = this.repository as MenuRepository;

    // 设置默认父级ID（如果未提供）
    const parentId = dto.parentId;

    // 检查同一父级下菜单名称是否重复
    const nameExist = await repo.findByNameAndParent(
      dto.menuName,
      parentId,
      tenantId,
    );
    if (nameExist) {
      throw new AppError(409, `菜单名称 '${dto.menuName}' 已存在`, 409);
    }

    // 如果提供了权限标识，检查是否重复
    if (dto.permission) {
      const permExist = await repo.findByPermission(dto.permission, tenantId);
      if (permExist) {
        throw new AppError(409, `权限标识 '${dto.permission}' 已存在`, 409);
      }
    }

    return dto;
  }
  // ============ CRUD 路由 ============
  @Get("/list")
  @ApiOperation("获取菜单列表", "平铺列表")
  @ApiQuery(MenuListSchema)
  @ApiResponse(200, "查询成功")
  async listMenu(@Req() req: Request, @Res() res: Response) {
    return super.list(req, res);
  }
  // ========== 获取菜单下的按钮列表 ==========
  @Get("/buttons")
  @ApiOperation("获取菜单按钮列表", "根据父菜单ID获取该菜单下的所有按钮")
  @ApiQuery(
    z.object({
      parentId: z.string().uuid({ message: "parentId 必须是有效的 UUID" }),
    }),
  )
  @ApiResponse(200, "查询成功")
  @ApiResponse(400, "参数错误")
  async buttons(@Req() req: Request, @Res() res: Response) {
    try {
      const parentId = req.query.parentId as string;
      if (!parentId) {
        throw new AppError(400, "缺少 parentId 参数", 400);
      }
      const data = await (
        this.repository as MenuRepository
      ).findButtonsByParent(parentId, req.tenantId!);
      success(res, data);
    } catch (err) {
      this.handleError(res, err);
    }
  }
  @Get("/detail/:id")
  @ApiOperation("获取菜单详情")
  @ApiResponse(200, "查询成功")
  async detailMenu(@Req() req: Request, @Res() res: Response) {
    return super.detail(req, res);
  }

  @Post("/")
  @ApiOperation("创建菜单")
  @ApiBody(MenuCreateSchema)
  @ApiResponse(200, "创建成功")
  async createMenu(@Req() req: Request, @Res() res: Response) {
    return super.create(req, res);
  }

  @Put("/:id")
  @ApiOperation("更新菜单")
  @ApiBody(MenuUpdateSchema)
  @ApiResponse(200, "更新成功")
  async updateMenu(@Req() req: Request, @Res() res: Response) {
    return super.update(req, res);
  }

  @Delete("/:id")
  @ApiOperation("删除菜单", "存在子菜单时禁止删除")
  @ApiResponse(200, "删除成功")
  async removeMenu(@Req() req: Request, @Res() res: Response) {
    return super.remove(req, res);
  }
}
