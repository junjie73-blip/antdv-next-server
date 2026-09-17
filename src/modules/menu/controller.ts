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
import { MenuRepository } from "./repository.js";
import { MenuService } from "./service.js";
import {
  MenuCreateSchema,
  MenuUpdateSchema,
  MenuListSchema,
} from "./schema.js";
import { AppError } from "@/core/errors.js";
import { success } from "@/common/utils/response.js";
import { upload } from "../user/controller.js";

@Controller("/menu", { tags: ["菜单管理"] })
export default class MenuController extends BaseController<any, any, any, any> {
  protected readonly repository = new MenuRepository();
  protected readonly service = new MenuService(this.repository); // ⭐ 必需
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

  // ============ 钩子 ============

  protected buildListWhere(query: any): any {
    const where: any = {};
    if (query.menuName) where.menu_name = { contains: query.menuName };
    if (query.status !== undefined) where.status = query.status;
    return where;
  }

  async beforeCreate(dto: any, req: Request): Promise<any> {
    dto = await super.beforeCreate(dto, req);
    await this.service.checkBeforeCreate(dto, req.tenantId!); // ⭐ 用 service
    return dto;
  }

  async beforeUpdate(id: string, dto: any, req: Request): Promise<any> {
    dto = await super.beforeUpdate(id, dto, req);
    await this.service.checkBeforeUpdate(id, dto, req.tenantId!); // ⭐
    return dto;
  }

  // ============ 自定义路由 ============

  @Get("/tree")
  @ApiQuery({
    menuType: z.string().optional(),
  })
  @ApiOperation("获取菜单树", "返回树形结构菜单")
  @ApiResponse(200, "查询成功")
  async tree(@Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.service.getTree(
        req.tenantId!,
        req.query.menuType
          ? (req.query.menuType as unknown as string).split(",").map(Number)
          : undefined,
      ); // ⭐
      success(res, data, "查询成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/buttons")
  @ApiOperation("获取菜单下的按钮列表")
  @ApiQuery(
    z.object({
      parentId: z.string().uuid({ message: "parentId 必须是有效的 UUID" }),
    }),
  )
  async buttons(@Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.service.getButtons(
        // ⭐
        req.query.parentId as string,
        req.tenantId!,
      );
      success(res, data);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  // ============ CRUD ============

  @Get("/list")
  @ApiOperation("获取菜单列表")
  @ApiQuery(MenuListSchema)
  async listMenu(@Req() req: Request, @Res() res: Response) {
    return super.list(req, res);
  }

  @Get("/detail/:id")
  @ApiOperation("获取菜单详情")
  async detailMenu(@Req() req: Request, @Res() res: Response) {
    return super.detail(req, res);
  }

  @Post("/")
  @ApiOperation("创建菜单")
  @ApiBody(MenuCreateSchema)
  async createMenu(@Req() req: Request, @Res() res: Response) {
    return super.create(req, res);
  }

  @Put("/:id")
  @ApiOperation("更新菜单")
  @ApiBody(MenuUpdateSchema)
  async updateMenu(@Req() req: Request, @Res() res: Response) {
    return super.update(req, res);
  }

  @Delete("/:id")
  @ApiOperation("删除菜单", "存在子菜单时禁止删除")
  async removeMenu(@Req() req: Request, @Res() res: Response) {
    return super.remove(req, res);
  }

  // 改变菜单状态
  @Put("/:id/status")
  @ApiOperation("改变菜单状态")
  @ApiBody({
    status: z.string().optional(),
  })
  async changeStatus(@Req() req: Request, @Res() res: Response) {
    try {
      await this.service.changeStatus(
        req.params.id,
        req.body.status,
        req.tenantId!,
      );
      return success(res, null, "状态改变成功");
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // ============ 导入导出 ============

  @Get("/export")
  @ApiOperation("导出菜单")
  async exportMenus(@Req() req: Request, @Res() res: Response) {
    try {
      const buffer = await this.service.exportToExcel(req.tenantId!);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=menus_${Date.now()}.xlsx`,
      );
      res.send(buffer);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/import")
  @ApiOperation("导入菜单")
  async importMenus(@Req() req: Request, @Res() res: Response) {
    upload.single("file")(req, res, async (err) => {
      if (err) {
        return this.handleError(res, new AppError("文件上传失败", 400001, 400));
      }
      if (!req.file) {
        return this.handleError(
          res,
          new AppError("请上传 Excel 文件", 400001, 400),
        );
      }
      try {
        const result = await this.service.importFromExcel(
          req.file.buffer,
          req.tenantId!,
          req.user?.userId,
        );
        success(res, result, "导入完成");
      } catch (err) {
        this.handleError(res, err);
      }
    });
  }
}
