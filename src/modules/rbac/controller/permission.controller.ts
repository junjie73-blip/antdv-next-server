import {
  Controller,
  Get,
  Req,
  Res,
  ApiOperation,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { success, error } from "@/shared/http/response.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { getUserPermissions } from "../service/index.js";

@Controller("/rbac/permission", { tags: ["RBAC-权限"] })
export default class RbacPermissionController {
  @Get("/user/:userId")
  @ApiOperation("查询用户权限码")
  async listByUser(@Req() req: Request, @Res() res: Response) {
    try {
      const perms = await getUserPermissions(req.params.userId, req.tenantId!);
      success(res, perms);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  private handleError(res: Response, err: unknown) {
    if (err instanceof AppError)
      return error(res, err.message, err.code, err.statusCode);
    logger.error({ err }, "[RbacPermission] error");
    error(res, "操作失败", 500, 500);
  }
}
