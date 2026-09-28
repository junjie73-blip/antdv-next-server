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
import { RoleRepository } from "./repository.js";
import {
  RoleCreateSchema,
  RoleUpdateSchema,
  RoleListSchema,
  RoleAssignMenusSchema,
  RoleAssignPermissionsSchema,
  RoleAssignUsersSchema,
  RoleAssignDeptsSchema,
} from "./schema.js";
import { AppError } from "@/middleware/http/error-handler.js";
import { z } from "zod";
import { prisma } from "@/config/database.js";
import { keysToCamelCase } from "@/shared/utils/case-convert.js";
import { success } from "@/shared/http/response.js";
import { RoleService } from "./service.js";
import { upload } from "../user/controller.js";

@Controller("/role", { tags: ["角色管理"] })
export default class RoleController extends BaseController<any, any, any, any> {
  protected readonly repository = new RoleRepository();
  protected readonly config = {
    routePrefix: "/api/v1/role",
    tags: ["角色管理"],
    permissionPrefix: "role",
    enableAudit: true,
    defaultPageSize: 10,
    maxPageSize: 100,
  };
  protected readonly createSchema = RoleCreateSchema;
  protected readonly updateSchema = RoleUpdateSchema;
  protected readonly querySchema = RoleListSchema;
  protected readonly service = new RoleService(this.repository);

  // ============ 钩子：唯一性校验 ============
  async beforeCreate(dto: any, req: Request): Promise<any> {
    dto = await super.beforeCreate(dto, req);
    await this.service.checkBeforeCreate(dto, req.tenantId!);
    return dto;
  }

  async beforeUpdate(id: string, dto: any, req: Request): Promise<any> {
    dto = await super.beforeUpdate(id, dto, req);
    await this.service.checkBeforeUpdate(id, dto, req.tenantId!);
    return dto;
  }

  buildListWhere(query: any): any {
    const where: any = {};
    if (query.keyword) {
      where.OR = [
        { role_code: { contains: query.keyword } },
        { role_name: { contains: query.keyword } },
      ];
    }
    if (query.status !== undefined) {
      where.status = query.status;
    }
    return where;
  }
  @Get("/options")
  @ApiOperation("获取角色选项", "用于下拉选择框")
  @ApiResponse(200, "角色选项列表")
  async options(@Req() req: Request, @Res() res: Response) {
    return this.repository.options(req.tenantId!);
  }
  @Get("/export")
  @ApiOperation("导出角色", "根据筛选条件导出角色为Excel")
  @ApiQuery(RoleListSchema)
  @ApiResponse(200, "Excel文件")
  async export(@Req() req: Request, @Res() res: Response) {
    try {
      const query = RoleListSchema.parse({
        ...req.query,
        pageNum: Number(req.query.pageNum) || 1,
        pageSize: Number(req.query.pageSize) || 10,
      });
      const where = this.buildListWhere(req.query);
      const buffer = await (this.repository as RoleRepository).exportRoles(
        where,
        req.tenantId!,
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=roles_${Date.now()}.xlsx`,
      );
      res.send(buffer);
    } catch (err) {
      this.handleError(res, err);
    }
  }
  @Post("/import")
  @ApiOperation("导入角色", "上传Excel批量导入角色")
  @ApiResponse(200, "导入结果")
  async import(@Req() req: Request, @Res() res: Response) {
    upload.single("file")(req, res, async (err) => {
      if (err)
        return this.handleError(res, new AppError("文件上传失败", 400, 400));
      if (!req.file)
        return this.handleError(res, new AppError("请上传Excel文件", 400, 400));
      try {
        const result = await (
          this.repository as RoleRepository
        ).importRolesFromExcel(
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
  // ============ 基础 CRUD 路由 ============
  @Get("/list")
  @ApiOperation("获取角色分页列表")
  @ApiQuery(RoleListSchema)
  @ApiResponse(200, "查询成功")
  async pageList(@Req() req: Request, @Res() res: Response) {
    return this.list(req, res);
  }

  @Get("/:id")
  @ApiOperation("获取角色详情", "包含关联的菜单ID和权限ID列表")
  @ApiResponse(200, "查询成功")
  @ApiResponse(404, "角色不存在")
  async getDetailRole(@Req() req: Request, @Res() res: Response) {
    try {
      const role = await (this.repository as RoleRepository).findRoleDetail(
        req.params.id,
        req.tenantId!,
      );
      if (!role) throw new AppError("角色不存在", 404, 404);
      const menuIds = role.sys_role_menu.map((m: any) => m.menu_id);
      const permIds = role.sys_role_permission.map((p: any) => p.perm_id);
      const { sys_role_menu, sys_role_permission, ...rest } = role;
      // @ts-ignore
      success(res, { ...keysToCamelCase(rest), menuIds, permIds });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/")
  @ApiOperation("创建角色")
  @ApiBody(RoleCreateSchema)
  @ApiResponse(200, "创建成功")
  @ApiResponse(409, "角色编码已存在")
  async createRole(@Req() req: Request, @Res() res: Response) {
    return super.create(req, res);
  }

  @Put("/:id")
  @ApiOperation("更新角色")
  @ApiBody(RoleUpdateSchema)
  @ApiResponse(200, "更新成功")
  @ApiResponse(409, "角色编码已存在")
  async updateRole(@Req() req: Request, @Res() res: Response) {
    return super.update(req, res);
  }

  @Delete("/:id")
  @ApiOperation("删除角色", "已分配用户的角色不可删除")
  @ApiResponse(200, "删除成功")
  @ApiResponse(400, "角色已分配用户")
  async removeRole(@Req() req: Request, @Res() res: Response) {
    try {
      await this.service.checkBeforeDelete(req.params.id, req.tenantId!); // ⭐
      return super.remove(req, res);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  // ============ 关联管理路由 ============

  // 分配菜单
  @Put("/:id/menus")
  @ApiOperation("分配菜单", "更新角色关联的菜单列表")
  @ApiBody(RoleAssignMenusSchema)
  @ApiResponse(200, "分配成功")
  async assignMenus(@Req() req: Request, @Res() res: Response) {
    try {
      const { menuIds } = req.body;
      await (this.repository as RoleRepository).updateRoleMenus(
        req.params.id,
        menuIds,
        req.tenantId!,
      );
      success(res, null, "分配成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }
  // 获取权限
  @Get("/:id/permissions")
  @ApiOperation("获取角色权限", "返回角色关联的权限ID数组")
  @ApiResponse(200, "查询成功")
  async getRolePermissions(@Req() req: Request, @Res() res: Response) {
    try {
      const permIds = await (this.repository as RoleRepository).findRolePermIds(
        req.params.id,
        req.tenantId!,
      );
      success(res, permIds, "查询成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }
  // 分配权限
  @Put("/:id/permissions")
  @ApiOperation("分配权限", "更新角色关联的权限列表")
  @ApiBody(RoleAssignPermissionsSchema)
  @ApiResponse(200, "分配成功")
  async assignPermissions(@Req() req: Request, @Res() res: Response) {
    try {
      const { permIds } = req.body;
      await (this.repository as RoleRepository).updateRolePermissions(
        req.params.id,
        permIds,
        req.tenantId!,
      );
      success(res, null, "分配成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }
  /** 分配数据权限部门（仅 data_scope = "2" 时生效） */
  @Put("/:id/depts")
  @ApiOperation(
    "分配数据权限部门",
    "更新角色关联的部门列表，仅当角色 data_scope = '2'（自定义）时生效",
  )
  @ApiBody(RoleAssignDeptsSchema)
  @ApiResponse(200, "分配成功")
  @ApiResponse(400, "部门ID非法")
  @ApiResponse(404, "角色不存在")
  async assignDepts(@Req() req: Request, @Res() res: Response) {
    try {
      const { deptIds } = RoleAssignDeptsSchema.parse(req.body);
      await (this.repository as RoleRepository).updateRoleDepts(
        req.params.id,
        deptIds,
        req.tenantId!,
      );
      success(res, null, "分配成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /** 获取角色已分配的数据权限部门 ID */
  @Get("/:id/depts")
  @ApiOperation("获取角色数据权限部门", "返回角色关联的部门ID数组")
  @ApiResponse(200, "查询成功")
  async getRoleDepts(@Req() req: Request, @Res() res: Response) {
    try {
      const deptIds = await (this.repository as RoleRepository).findRoleDeptIds(
        req.params.id,
        req.tenantId!,
      );
      success(res, deptIds, "查询成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }
  // 分配用户
  @Put("/:id/users")
  @ApiOperation("分配用户", "更新角色关联的用户列表")
  @ApiBody(RoleAssignUsersSchema)
  @ApiResponse(200, "分配成功")
  async assignUsers(@Req() req: Request, @Res() res: Response) {
    try {
      const { userIds } = req.body;
      await (this.repository as RoleRepository).updateRoleUsers(
        req.params.id,
        req.tenantId!,
        userIds,
      );
      success(res, null, "分配成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  // 获取角色用户列表
  @Get("/:id/users")
  @ApiOperation("获取角色用户", "获取角色关联的用户列表")
  @ApiResponse(200, "查询成功")
  async getRoleUsers(@Req() req: Request, @Res() res: Response) {
    try {
      const users = await (this.repository as RoleRepository).findRoleUsers(
        req.params.id,
        req.tenantId!,
      );
      success(res, users, "查询成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }
  @Get("/:id/menus/tree")
  @ApiOperation("获取角色菜单树", "返回菜单树并标记角色已关联的菜单")
  @ApiResponse(200, "查询成功")
  async getRoleMenuTree(@Req() req: Request, @Res() res: Response) {
    try {
      const roleId = req.params.id;
      const menuIds = await (this.repository as RoleRepository).findRoleMenuIds(
        roleId,
        req.tenantId!,
      );
      success(res, menuIds);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  private buildTreeWithChecked(
    items: any[],
    parentId: string | null,
    checkedSet: Set<string>,
  ): any[] {
    const parent = parentId;
    return items
      .filter((item) => item.parent_id === parent)
      .map((item) => ({
        ...keysToCamelCase(item),
        checked: checkedSet.has(item.menu_id),
        children: this.buildTreeWithChecked(items, item.menu_id, checkedSet),
      }));
  }
}
