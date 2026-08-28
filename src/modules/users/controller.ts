import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Tag,
  Summary,
  Body,
  Query,
  Params,
  RequirePermission,
  Middleware,
} from "@common/core/decorators.js";
import { BaseCrudController } from "@common/core/base-crud-controller.js";
import { UserRepository } from "./repository.js";
import {
  UserSchema,
  CreateUserBody,
  UpdateUserBody,
  UpdatePasswordBody,
  AssignRoleBody,
  UserListQuery,
} from "./schema.js";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { rbacCache } from "@common/rbac/cache.js";
import { authMiddleware } from "@common/middleware/auth.js";

@Controller("/users")
export default class UserController extends BaseCrudController {
  protected repository = new UserRepository();
  protected schemas = {
    tag: "用户管理",
    summaryPrefix: "用户",
    listQuery: UserListQuery,
    createBody: CreateUserBody,
    updateBody: UpdateUserBody,
    responseSchema: UserSchema,
  };
  protected defaultPermissions = {
    list: ["user:read"],
    get: ["user:read"],
    create: ["user:write"],
    update: ["user:write"],
    delete: ["user:delete"],
  };

  protected toResponse(item: any): any {
    const { passwordHash, mfaSecret, ...rest } = item;
    return rest;
  }

  @Tag("用户管理")
  @Summary("获取当前登录用户信息")
  @Middleware(authMiddleware)
  @RequirePermission("user:read")
  @Get("/me")
  async me(req: any, res: any) {
    const user = await (this.repository as UserRepository).findWithRoles(
      req.user.id,
      req.user.tenantId,
    );
    if (!user) {
      return res.status(404).json({ success: false, message: "用户不存在" });
    }
    res.json({ success: true, data: this.toResponse(user) });
  }

  @Tag("用户管理")
  @Summary("修改当前用户密码")
  @Middleware(authMiddleware)
  @RequirePermission("user:write")
  @Body(UpdatePasswordBody)
  @Put("/password")
  async changePassword(req: any, res: any) {
    const { oldPassword, newPassword } = req.body;
    const user = await this.repository.findById(req.user.id, req.user.tenantId);
    if (!user || !user.passwordHash) {
      return res.status(400).json({ success: false, message: "用户无效" });
    }
    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ success: false, message: "原密码错误" });
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await (this.repository as UserRepository).updatePassword(
      req.user.id,
      req.user.tenantId,
      passwordHash,
    );
    res.json({ success: true, message: "密码修改成功" });
  }

  @Tag("用户管理")
  @Summary("为用户分配角色")
  @Middleware(authMiddleware)
  @RequirePermission("user:manage")
  @Body(AssignRoleBody)
  @Post("/:id/roles")
  async assignRole(req: any, res: any) {
    const { id } = req.params;
    const { roleId } = req.body;
    const { tenantId } = req.query;
    await (this.repository as UserRepository).assignRole(id, roleId);
    await rbacCache.invalidate(tenantId, id);
    res.json({ success: true });
  }

  @Tag("用户管理")
  @Summary("移除用户角色")
  @Middleware(authMiddleware)
  @RequirePermission("user:manage")
  @Delete("/:id/roles/:roleId")
  async removeRole(req: any, res: any) {
    const { id, roleId } = req.params;
    const { tenantId } = req.query;
    await (this.repository as UserRepository).removeRole(id, roleId);
    await rbacCache.invalidate(tenantId, id);
    res.json({ success: true });
  }

  @Tag("用户管理")
  @Summary("获取用户角色列表")
  @Middleware(authMiddleware)
  @RequirePermission("user:read")
  @Get("/:id/roles")
  async userRoles(req: any, res: any) {
    const { id } = req.params;
    const { tenantId } = req.query;
    const roles = await (this.repository as UserRepository).getUserRoles(
      id,
      tenantId,
    );
    res.json({ success: true, data: roles.map((r: any) => r.role) });
  }
}
