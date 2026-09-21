import {
  Controller,
  Get,
  Post,
  Delete,
  Req,
  Res,
  ApiOperation,
  ApiBody,
  ApiResponse,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { success, error } from "@/shared/http/response.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { assignRoleToUser, removeRoleFromUser } from "../service/index.js";

@Controller("/rbac/role", { tags: ["RBAC-角色"] })
export default class RbacRoleController {
  @Post("/assign")
  @ApiOperation("给用户分配角色")
  @ApiBody({
    type: "object",
    properties: {
      userId: { type: "string" },
      roleId: { type: "string" },
    },
  })
  @ApiResponse(200, "分配成功")
  async assign(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, roleId } = req.body;
      if (!userId || !roleId) throw new AppError("缺少参数", 400001, 400);
      await assignRoleToUser(userId, roleId, req.tenantId!);
      success(res, null, "分配成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Delete("/remove")
  @ApiOperation("移除用户角色")
  async remove(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, roleId } = req.query as Record<string, string>;
      if (!userId || !roleId) throw new AppError("缺少参数", 400001, 400);
      await removeRoleFromUser(userId, roleId, req.tenantId!);
      success(res, null, "移除成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/user/:userId")
  @ApiOperation("查询用户角色")
  async listByUser(@Req() req: Request, @Res() res: Response) {
    try {
      const { getUserRoles } = await import("../service/index.js");
      const roles = await getUserRoles(req.params.userId, req.tenantId!);
      success(res, roles);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  private handleError(res: Response, err: unknown) {
    if (err instanceof AppError)
      return error(res, err.message, err.code, err.statusCode);
    logger.error({ err }, "[RbacRole] error");
    error(res, "操作失败", 500, 500);
  }
}
