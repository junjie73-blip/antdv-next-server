import {
  Controller,
  Post,
  Req,
  Res,
  ApiOperation,
  ApiBody,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { success, error } from "@/shared/http/response.js";
import { getClientIp } from "@/shared/utils/ip.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { AuthService } from "../service/index.js";
import { LoginSchema, RefreshTokenSchema } from "../schema.js";

@Controller("/auth", { tags: ["认证"] })
export default class AuthLoginController {
  private service = new AuthService();

  @Post("/login")
  @ApiOperation("用户登录")
  @ApiBody(LoginSchema)
  async login(@Req() req: Request, @Res() res: Response) {
    try {
      const dto = LoginSchema.parse(req.body);
      const data = await this.service.login({
        ...dto,
        clientIp: getClientIp(req) || "",
        userAgent: req.headers["user-agent"] || "",
      });
      success(
        res,
        data,
        data.mustChangePassword ? "密码已过期，请修改后使用" : "登录成功",
      );
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/refresh")
  @ApiOperation("刷新令牌")
  @ApiBody(RefreshTokenSchema)
  async refresh(@Req() req: Request, @Res() res: Response) {
    try {
      const { refreshToken } = RefreshTokenSchema.parse(req.body);
      success(res, await this.service.refresh(refreshToken), "刷新成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/logout")
  @ApiOperation("登出")
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = req.user || {};
      const deviceId = (req as any).deviceId;
      if (userId && tenantId && deviceId) {
        await this.service.logout(tenantId, userId, deviceId);
      }
      success(res, null, "登出成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  private handleError(res: Response, err: unknown) {
    if (err instanceof AppError)
      return error(res, err.message, err.code, err.statusCode);
    logger.error({ err }, "[AuthLogin] error");
    error(res, "操作失败", 500, 500);
  }
}
