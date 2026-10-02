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
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { z } from "zod";
import { UserGroupRepository } from "../repository.js";
import { AppError } from "@/core/errors.js";
import { success, pageSuccess, error } from "@/shared/http/response.js";
import { logger } from "@/platform/logger/index.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import {
  UserGroupCreateSchema,
  UserGroupUpdateSchema,
  UserGroupListSchema,
  AddMembersSchema,
  RemoveMembersSchema,
  AssignRolesSchema,
} from "../schema.js";
import { UserGroupService } from "../service/user-group.service.js";

interface AuthUser {
  userId: string;
  tenantId: string;
}

@Controller("/user-group", { tags: ["用户组"] })
export default class UserGroupController {
  private repo = new UserGroupRepository();
  private service = new UserGroupService(this.repo);

  /* ============================================================
   * 列表 / 选项 / 详情
   * ============================================================ */
  @Get("/list")
  @RequirePermission("user-group:list")
  @ApiOperation("用户组分页列表")
  @ApiQuery(UserGroupListSchema)
  async list(@Req() req: Request, @Res() res: Response) {
    try {
      const { tenantId } = this.getAuth(req);
      const dto = UserGroupListSchema.parse(req.query);
      const data = await this.service.list(tenantId, dto);
      pageSuccess(res, data.list, data.total, data.pageNum, data.pageSize);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/options")
  @ApiOperation("用户组下拉选项")
  async options(@Req() req: Request, @Res() res: Response) {
    try {
      const { tenantId } = this.getAuth(req);
      success(res, await this.service.options(tenantId));
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/:id")
  @RequirePermission("user-group:list")
  @ApiOperation("用户组详情（含成员 + 角色）")
  async detail(@Req() req: Request, @Res() res: Response) {
    try {
      const { tenantId } = this.getAuth(req);
      success(res, await this.service.detail(req.params.id, tenantId));
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * CRUD
   * ============================================================ */
  @Post("/")
  @RequirePermission("user-group:create")
  @ApiOperation("创建用户组")
  @ApiBody(UserGroupCreateSchema)
  async create(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const dto = UserGroupCreateSchema.parse(req.body);
      const data = await this.service.create(dto, tenantId, userId);
      success(res, data, "创建成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Put("/:id")
  @RequirePermission("user-group:update")
  @ApiOperation("更新用户组")
  @ApiBody(UserGroupUpdateSchema)
  async update(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const dto = UserGroupUpdateSchema.parse(req.body);
      await this.service.update(req.params.id, dto, tenantId, userId);
      success(res, null, "更新成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Delete("/:id")
  @RequirePermission("user-group:delete")
  @ApiOperation("删除用户组", "级联清理成员和角色绑定")
  async remove(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      await this.service.remove(req.params.id, tenantId, userId);
      success(res, null, "删除成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * 成员管理
   * ============================================================ */
  @Get("/:id/members")
  @RequirePermission("user-group:list")
  @ApiOperation("获取用户组成员")
  async members(@Req() req: Request, @Res() res: Response) {
    try {
      const { tenantId } = this.getAuth(req);
      const detail = await this.service.detail(req.params.id, tenantId);
      success(res, detail.members);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/:id/members")
  @RequirePermission("user-group:manage-member")
  @ApiOperation("批量添加成员")
  @ApiBody(AddMembersSchema)
  async addMembers(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const { userIds } = AddMembersSchema.parse(req.body);
      const result = await this.service.addMembers(
        req.params.id,
        userIds,
        tenantId,
        userId,
      );
      success(res, result, "添加成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Delete("/:id/members")
  @RequirePermission("user-group:manage-member")
  @ApiOperation("批量移除成员")
  @ApiBody(RemoveMembersSchema)
  async removeMembers(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const { userIds } = RemoveMembersSchema.parse(req.body);
      const result = await this.service.removeMembers(
        req.params.id,
        userIds,
        tenantId,
        userId,
      );
      success(res, result, "移除成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * 角色绑定
   * ============================================================ */
  @Get("/:id/roles")
  @RequirePermission("user-group:list")
  @ApiOperation("获取用户组绑定的角色")
  async roles(@Req() req: Request, @Res() res: Response) {
    try {
      const { tenantId } = this.getAuth(req);
      const detail = await this.service.detail(req.params.id, tenantId);
      success(res, detail.roles);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Put("/:id/roles")
  @RequirePermission("user-group:manage-role")
  @ApiOperation("全量更新用户组角色")
  @ApiBody(AssignRolesSchema)
  async assignRoles(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const { roleIds } = AssignRolesSchema.parse(req.body);
      const result = await this.service.assignRoles(
        req.params.id,
        roleIds,
        tenantId,
        userId,
      );
      success(res, result, "更新成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * 工具
   * ============================================================ */
  private getAuth(req: Request): { userId: string; tenantId: string } {
    const user = req.user as AuthUser | undefined;
    if (!user?.userId) throw new AppError("未认证", 401001, 401);
    const tenantId = req.tenantId || user.tenantId;
    if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);
    return { userId: user.userId, tenantId };
  }

  private handleError(res: Response, err: unknown): void {
    if (res.headersSent) return;
    if (err instanceof AppError) {
      error(res, err.message, err.code, err.statusCode);
      return;
    }
    logger.error({ err }, "[UserGroup] error");
    error(res, "操作失败", 500, 500);
  }
}
