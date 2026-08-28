import {
  Controller,
  Get,
  Post,
  Delete,
  Tag,
  Summary,
  Body,
  Params,
  RequirePermission,
  Middleware,
} from "@common/core/decorators.js";
import { UserRoleRepository } from "./repository.js";
import { CreateUserRoleBody } from "./schema.js";
import { z } from "zod";
import { rbacCache } from "@common/rbac/cache.js";
import { authMiddleware } from "@common/middleware/auth.js";
import { prisma } from "@config/database.js";

@Controller("/user-roles")
export default class UserRoleController {
  private repo = new UserRoleRepository();

  @Tag("用户角色管理")
  @Summary("查询用户的角色")
  @Middleware(authMiddleware)
  @RequirePermission("role:read")
  @Get("/user/:userId")
  async byUser(req: any, res: any) {
    const { userId } = req.params;
    const data = await this.repo.findByUser(userId);
    res.json({
      success: true,
      data: data.map((d: any) => ({ ...d.role, assignedAt: d.createdAt })),
    });
  }

  @Tag("用户角色管理")
  @Summary("查询角色下的用户")
  @Middleware(authMiddleware)
  @RequirePermission("role:read")
  @Get("/role/:roleId")
  async byRole(req: any, res: any) {
    const { roleId } = req.params;
    const data = await this.repo.findByRole(roleId);
    res.json({
      success: true,
      data: data.map((d: any) => ({ ...d.user, assignedAt: d.createdAt })),
    });
  }

  @Tag("用户角色管理")
  @Summary("分配角色给用户")
  @Middleware(authMiddleware)
  @RequirePermission("role:write")
  @Body(CreateUserRoleBody)
  @Post("/")
  async create(req: any, res: any) {
    const { userId, roleId } = req.body;
    const item = await this.repo.create({ userId, roleId });

    // 通过 user 查询 tenantId 来清除缓存
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) await rbacCache.invalidate(user.tenantId, userId);

    res.status(201).json({ success: true, data: item });
  }

  @Tag("用户角色管理")
  @Summary("移除用户角色")
  @Middleware(authMiddleware)
  @RequirePermission("role:write")
  @Delete("/:userId/:roleId")
  async remove(req: any, res: any) {
    const { userId, roleId } = req.params;
    await this.repo.delete(userId, roleId);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) await rbacCache.invalidate(user.tenantId, userId);

    res.json({ success: true });
  }
}
