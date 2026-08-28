import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Tag,
  Summary,
  Description,
  Body,
  Query,
  Params,
  RequirePermission,
} from "@common/core/decorators.js";
import { BaseCrudController } from "@common/core/base-crud-controller.js";
import { MenuRepository } from "./repository.js";
import { MenuSchema, CreateMenuBody, AssignRoleBody } from "./schema.js";
import { rbacService } from "@common/rbac/service.js";
import { z } from "zod";

@Controller("/menus")
export default class MenuController extends BaseCrudController {
  protected repository = new MenuRepository();
  protected schemas = {
    tag: "菜单管理",
    summaryPrefix: "菜单",
    listQuery: z.object({ tenantId: z.string() }),
    createBody: CreateMenuBody,
    responseSchema: MenuSchema,
  };
  protected defaultPermissions = {
    list: ["menu:read"],
    create: ["menu:write"],
    update: ["menu:write"],
    delete: ["menu:delete"],
  };

  @Tag("菜单管理")
  @Summary("获取菜单树")
  @RequirePermission("menu:read")
  @Get("/tree")
  async tree(req: any, res: any) {
    const { tenantId } = req.query;
    const tree = await (this.repository as MenuRepository).findTree(tenantId);
    res.json({ success: true, data: tree });
  }

  @Tag("菜单管理")
  @Summary("获取当前用户菜单")
  @Get("/user-tree")
  async userTree(req: any, res: any) {
    const { tenantId } = req.query;
    const userId = req.user?.id;

    const roleIds = await rbacService.getUserRoles(tenantId, userId);
    const tree = await (this.repository as MenuRepository).findTree(tenantId, {
      roleIds,
    });

    // 获取按钮权限码
    const permissions = await (
      this.repository as MenuRepository
    ).getButtonPermissions(tenantId, roleIds);

    res.json({ success: true, data: { menus: tree, permissions } });
  }

  @Tag("菜单管理")
  @Summary("获取角色已分配菜单")
  @RequirePermission("menu:read")
  @Get("/role/:roleId")
  async roleMenus(req: any, res: any) {
    const { roleId } = req.params;
    const { tenantId } = req.query;
    const data = await (this.repository as MenuRepository).findByRole(
      tenantId,
      roleId,
    );
    res.json({ success: true, data: data.map((d: any) => d.menu) });
  }

  @Tag("菜单管理")
  @Summary("为角色分配菜单")
  @RequirePermission("menu:write")
  @Put("/assign-role")
  async assignRole(req: any, res: any) {
    const { tenantId } = req.query;
    const { roleId, menuIds } = req.body;
    await (this.repository as MenuRepository).assignRole(
      tenantId,
      roleId,
      menuIds,
    );
    res.json({ success: true });
  }
}
