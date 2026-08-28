import {
  Controller,
  Post,
  Tag,
  Summary,
  Body,
  RequirePermission,
  Middleware,
} from "@common/core/decorators.js";
import { BaseCrudController } from "@common/core/base-crud-controller.js";
import { TenantRepository } from "./repository.js";
import { TenantSchema, CreateTenantBody, UpdateTenantBody } from "./schema.js";
import { z } from "zod";
import { initTenantRbac } from "@common/rbac/init.js";
import { authMiddleware } from "@common/middleware/auth.js";

@Controller("/tenants")
export default class TenantController extends BaseCrudController {
  protected repository = new TenantRepository();
  protected schemas = {
    tag: "租户管理",
    summaryPrefix: "租户",
    listQuery: z.object({}),
    createBody: CreateTenantBody,
    updateBody: UpdateTenantBody,
    responseSchema: TenantSchema,
  };

  protected defaultPermissions = {
    list: ["tenant:manage"],
    get: ["tenant:manage"],
    create: ["tenant:manage"],
    update: ["tenant:manage"],
    delete: ["tenant:manage"],
  };

  @Tag("租户管理")
  @Summary("创建租户并初始化RBAC")
  @Middleware(authMiddleware)
  @RequirePermission("tenant:manage")
  @Body(CreateTenantBody)
  @Post("/")
  async create(req: any, res: any) {
    const item = await this.repository.create(req.body);
    await initTenantRbac(item.id);
    res.status(201).json({ success: true, data: item });
  }
}
