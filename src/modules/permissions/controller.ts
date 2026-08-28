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
import { PermissionRepository } from "./repository.js";
import { z } from "zod";
import { authMiddleware } from "@common/middleware/auth.js";

const PermissionSchema = z
  .object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    resource: z.string(),
    action: z.string(),
  })
  .openapi("Permission");

const CreatePermissionBody = z
  .object({
    code: z.string().regex(/^[a-z]+:[a-z]+$/),
    name: z.string(),
    resource: z.string(),
    action: z.string(),
  })
  .openapi("CreatePermissionBody");

const UpdatePermissionBody = z
  .object({
    name: z.string().optional(),
    resource: z.string().optional(),
    action: z.string().optional(),
  })
  .openapi("UpdatePermissionBody");

@Controller("/permissions")
export default class PermissionController extends BaseCrudController {
  protected repository = new PermissionRepository();
  protected schemas = {
    tag: "权限管理",
    summaryPrefix: "权限",
    listQuery: z.object({ tenantId: z.string() }),
    createBody: CreatePermissionBody,
    updateBody: UpdatePermissionBody,
    responseSchema: PermissionSchema,
  };

  protected defaultPermissions = {
    list: ["permission:read"],
    get: ["permission:read"],
    create: ["permission:manage"],
    update: ["permission:manage"],
    delete: ["permission:manage"],
  };
}
