import {
  Controller,
  Get,
  Post,
  Put,
  Req,
  Res,
  ApiOperation,
  ApiBody,
  ApiQuery,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { success, error, pageSuccess } from "@/shared/http/response.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { AuthService, EmailVerifyService } from "../service/index.js";
import {
  CancelAccountSchema,
  ChangePasswordSchema,
  SendEmailCodeSchema,
  UpdateProfileSchema,
  VerifyEmailSchema,
} from "../schema.js";
import { CancelAccountService } from "../service/cancel-account.service.js";
import { getClientIp } from "@/shared/utils/index.js";
import { z } from "zod";

@Controller("/auth", { tags: ["认证"] })
export default class AuthProfileController {
  private service = new AuthService();
  private cancelService = new CancelAccountService();
  private emailVerifyService = new EmailVerifyService();
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
  /**
   * 查询当前用户的注销状态
   */
  @Get("/cancel-account/status")
  @ApiOperation("查询账号注销状态")
  async getCancelStatus(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = req.user || {};
      if (!userId || !tenantId) throw new AppError("未认证", 401001, 401);
      const data = await this.cancelService.getStatus(userId, tenantId);
      success(res, data);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /**
   * 提交注销申请
   */
  @Post("/cancel-account")
  @ApiOperation("提交账号注销申请")
  @ApiBody(CancelAccountSchema)
  async submitCancel(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId, username } = req.user || {};
      if (!userId || !tenantId) throw new AppError("未认证", 401001, 401);

      const dto = CancelAccountSchema.parse(req.body);
      const data = await this.cancelService.submit({
        userId,
        tenantId,
        username: username || "",
        password: dto.password,
        reason: dto.reason,
        clientIp: getClientIp(req) || "",
        userAgent: req.headers["user-agent"] || "",
      });

      success(
        res,
        data,
        `注销申请已提交，将于 ${data.bufferDays} 天后生效，期间登录可自动撤销`,
      );
    } catch (err) {
      this.handleError(res, err);
    }
  }
  @Get("/my/login-logs")
  @ApiOperation("查询我的登录日志")
  @ApiQuery(
    z.object({
      pageNum: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(10),
      status: z.enum(["0", "1"]).optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
    }),
  )
  async myLoginLogs(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = req.user || {};
      if (!userId || !tenantId) throw new AppError("未认证", 401001, 401);

      const { pageNum, pageSize, status, startTime, endTime } =
        req.query as any;

      const data = await this.service.getMyLoginLogs(
        userId,
        tenantId,
        Number(pageNum) || 1,
        Number(pageSize) || 10,
        {
          status,
          startTime: startTime ? new Date(startTime) : undefined,
          endTime: endTime ? new Date(endTime) : undefined,
        },
      );

      pageSuccess(
        res,
        data.list,
        data.total,
        Number(pageNum) || 1,
        Number(pageSize) || 10,
      );
    } catch (err) {
      this.handleError(res, err);
    }
  }
  /**
   * 发送邮箱验证码
   */
  @Post("/email/send-code")
  @ApiOperation("发送邮箱验证码")
  @ApiBody(SendEmailCodeSchema)
  async sendEmailCode(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = req.user || {};
      if (!userId || !tenantId) throw new AppError("未认证", 401001, 401);

      const dto = SendEmailCodeSchema.parse(req.body);
      const result = await this.emailVerifyService.sendCode(
        userId,
        tenantId,
        dto.email,
        dto.scene,
      );

      success(res, result, "验证码已发送，请查收邮箱");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /**
   * 验证并绑定邮箱
   */
  @Post("/email/verify")
  @ApiOperation("验证并绑定邮箱")
  @ApiBody(VerifyEmailSchema)
  async verifyEmail(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = req.user || {};
      if (!userId || !tenantId) throw new AppError("未认证", 401001, 401);

      const dto = VerifyEmailSchema.parse(req.body);
      await this.emailVerifyService.verifyAndBind(
        userId,
        tenantId,
        dto.email,
        dto.code,
      );

      success(res, null, "邮箱验证成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }
}
