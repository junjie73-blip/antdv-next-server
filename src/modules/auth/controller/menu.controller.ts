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
import { AuthService } from "../service/index.js";

@Controller("/auth", { tags: ["认证"] })
export default class AuthMenuController {
  private service = new AuthService();

  @Get("/menus")
  @ApiOperation("获取当前用户菜单树")
  async getMyMenus(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = req.user!;
      success(res, await this.service.getMyMenus(userId, tenantId));
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/permissions")
  @ApiOperation("获取当前用户权限列表")
  async getMyPermissions(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = req.user!;
      success(res, await this.service.getMyPermissions(userId, tenantId));
    } catch (err) {
      this.handleError(res, err);
    }
  }

  private handleError(res: Response, err: unknown) {
    if (err instanceof AppError)
      return error(res, err.message, err.code, err.statusCode);
    logger.error({ err }, "[AuthMenu] error");
    error(res, "操作失败", 500, 500);
  }
}
