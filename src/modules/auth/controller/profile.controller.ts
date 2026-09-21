import {
  Controller,
  Get,
  Post,
  Put,
  Req,
  Res,
  ApiOperation,
  ApiBody,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { success, error } from "@/shared/http/response.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { AuthService } from "../service/index.js";
import { ChangePasswordSchema, UpdateProfileSchema } from "../schema.js";

@Controller("/auth", { tags: ["认证"] })
export default class AuthProfileController {
  private service = new AuthService();

  @Get("/profile")
  @ApiOperation("获取当前用户信息")
  async profile(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = req.user || {};
      if (!userId || !tenantId) throw new AppError("未认证", 401001, 401);
      success(res, await this.service.getProfile(userId, tenantId));
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/profile")
  @ApiOperation("更新个人信息")
  @ApiBody(UpdateProfileSchema)
  async updateProfile(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = req.user || {};
      if (!userId || !tenantId) throw new AppError("未认证", 401001, 401);
      const dto = UpdateProfileSchema.parse(req.body);
      await this.service.updateProfile(userId, tenantId, dto);
      success(res, null, "个人信息更新成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Put("/password")
  @ApiOperation("修改密码")
  @ApiBody(ChangePasswordSchema)
  async changePassword(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = req.user || {};
      if (!userId || !tenantId) throw new AppError("未认证", 401001, 401);
      const { oldPassword, newPassword } = ChangePasswordSchema.parse(req.body);
      await this.service.changePassword(
        userId,
        tenantId,
        oldPassword,
        newPassword,
      );
      success(res, null, "密码修改成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  private handleError(res: Response, err: unknown) {
    if (err instanceof AppError)
      return error(res, err.message, err.code, err.statusCode);
    logger.error({ err }, "[AuthProfile] error");
    error(res, "操作失败", 500, 500);
  }
}
