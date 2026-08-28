import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Tag,
  Summary,
  Body,
  Params,
  RequirePermission,
  Middleware,
} from "@common/core/decorators.js";
import { BaseCrudController } from "@common/core/base-crud-controller.js";
import { RoleRepository } from "./repository.js";
import { z } from "zod";
import { rbacCache } from "@common/rbac/cache.js";
import { authMiddleware } from "@/common/middleware/auth.js";

const RoleSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
    description: z.string().nullable(),
    isSystem: z.boolean(),
  })
  .openapi("Role");

const CreateRoleBody = z
  .object({
    name: z.string().min(1).max(50),
    code: z
      .string()
      .min(1)
      .max(50)
      .regex(/^[A-Z_]+$/),
    description: z.string().optional(),
  })
  .openapi("CreateRoleBody");

@Controller("/roles")
export default class RoleController extends BaseCrudController {
  protected repository = new RoleRepository();
  protected schemas = {
    tag: "角色管理",
    summaryPrefix: "角色",
    listQuery: z.object({ tenantId: z.string() }),
    createBody: CreateRoleBody,
    responseSchema: RoleSchema,
  };
  protected defaultPermissions = {
    list: ["role:read"],
    create: ["role:write"],
    update: ["role:write"],
    delete: ["role:delete"],
  };

  @Tag("角色管理")
  @Summary("分配权限给角色")
  @RequirePermission("role:manage")
  @Post("/:id/permissions")
  async assignPermission(req: any, res: any) {
    const { id } = req.params;
    const { permissionId } = req.body;
    await this.repository.assignPermission(
      req.query.tenantId,
      id,
      permissionId,
    );
    await rbacCache.invalidateTenant(req.query.tenantId);
    res.json({ success: true });
  }

  @Tag("角色管理")
  @Summary("移除角色权限")
  @RequirePermission("role:manage")
  @Delete("/:id/permissions/:permissionId")
  async removePermission(req: any, res: any) {
    const { id, permissionId } = req.params;
    await this.repository.removePermission(id, permissionId);
    await rbacCache.invalidateTenant(req.query.tenantId);
    res.json({ success: true });
  }
  @Tag("角色管理")
  @Summary("获取角色的权限列表")
  @Middleware(authMiddleware)
  @RequirePermission("role:read")
  @Get("/:id/permissions")
  async getRolePermissions(req: any, res: any) {
    const { id } = req.params;
    const { tenantId } = req.query;
    const permissions = await (this.repository as any).findRolePermissions(
      id,
      tenantId,
    );
    res.json({ success: true, data: permissions });
  }
}
