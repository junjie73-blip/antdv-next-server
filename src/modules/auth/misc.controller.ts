import {
  Controller,
  Get,
  Req,
  Res,
  ApiOperation,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { error, success } from "@/common/utils/response.js";
import { createCaptcha } from "./captcha.service.js";
import { getPasswordPolicy } from "./password-policy.service.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/core/logger/logger.js";

@Controller("/auth", { tags: ["认证"] })
export default class AuthMiscController {
  @Get("/captcha")
  @ApiOperation("获取图形验证码")
  async captcha(@Req() _req: Request, @Res() res: Response) {
    try {
      success(res, await createCaptcha());
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/password-policy")
  @ApiOperation("获取密码策略")
  async getPolicy(@Req() _req: Request, @Res() res: Response) {
    try {
      success(res, await getPasswordPolicy());
    } catch (err) {
      this.handleError(res, err);
    }
  }

  private handleError(res: Response, err: unknown) {
    if (err instanceof AppError)
      return error(res, err.message, err.code, err.statusCode);
    logger.error({ err }, "[AuthMisc] error");
    error(res, "操作失败", 500, 500);
  }
}
