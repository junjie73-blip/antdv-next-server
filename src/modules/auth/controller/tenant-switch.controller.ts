import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  ApiOperation,
  ApiBody,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { z } from "zod";
import { success, error } from "@/shared/http/response.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { AuthService } from "../service/index.js";

@Controller("/auth", { tags: ["认证"] })
export default class AuthTenantSwitchController {
  private service = new AuthService();

  @Post("/switch-tenant")
  @ApiOperation("切换租户")
  @ApiBody(z.object({ tenantId: z.string().uuid() }))
  async switchTenant(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId: fromTenantId } = req.user!;
      const deviceId = (req as any).deviceId;
      const { tenantId: toTenantId } = req.body;
      const data = await this.service.switchTenant(
        userId,
        fromTenantId,
        toTenantId,
        deviceId,
      );
      success(res, data, "切换成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/tenants")
  @ApiOperation("获取用户可访问的租户列表")
  async listTenants(@Req() req: Request, @Res() res: Response) {
    try {
      success(res, await this.service.listTenants(req.user!.userId));
    } catch (err) {
      this.handleError(res, err);
    }
  }

  private handleError(res: Response, err: unknown) {
    if (err instanceof AppError)
      return error(res, err.message, err.code, err.statusCode);
    logger.error({ err }, "[AuthTenantSwitch] error");
    error(res, "操作失败", 500, 500);
  }
}
