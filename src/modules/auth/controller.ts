import {
  Controller,
  Post,
  Get,
  Put,
  Req,
  Res,
  ApiOperation,
  ApiBody,
  ApiResponse,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { z } from "zod";
import { success } from "@/common/utils/response.js";
import { getClientIp } from "@/common/utils/ip.js";
import { AuthService } from "./service.js";
import { createCaptcha } from "./captcha.service.js";
import { getPasswordPolicy } from "./password-policy.service.js";
import {
  LoginSchema,
  RefreshTokenSchema,
  ChangePasswordSchema,
  UpdateProfileSchema,
  RegisterSchema,
  ForgotPasswordSchema,
} from "./schema.js";
import { UserRepository } from "../user/repository.js";
import { AppError } from "@/core/errors.js";

@Controller("/auth", { tags: ["认证"] })
export default class AuthController {
  private service = new AuthService();
  private userRepository = new UserRepository();

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
      const data = await this.service.refresh(refreshToken);
      success(res, data, "刷新成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/logout")
  @ApiOperation("登出")
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      const userId = req.user?.userId;
      const tenantId = req.user?.tenantId;
      const deviceId = (req as any).deviceId;
      if (userId && tenantId && deviceId) {
        await this.service.logout(tenantId, userId, deviceId);
      }
      success(res, null, "登出成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/profile")
  @ApiOperation("获取当前用户信息")
  async profile(@Req() req: Request, @Res() res: Response) {
    try {
      const userId = req.user?.userId;
      const tenantId = req.tenantId;
      if (!userId || !tenantId) throw new AppError("未认证", 401001, 401);
      const data = await this.service.getProfile(userId, tenantId);
      success(res, data);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/profile")
  @ApiOperation("更新个人信息")
  @ApiBody(UpdateProfileSchema)
  async updateProfile(@Req() req: Request, @Res() res: Response) {
    try {
      const userId = req.user?.userId;
      const tenantId = req.tenantId;
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
      const userId = req.user?.userId;
      const tenantId = req.tenantId;
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

  @Post("/forgot-password")
  @ApiOperation("忘记密码")
  @ApiBody(ForgotPasswordSchema)
  async forgotPassword(@Req() req: Request, @Res() res: Response) {
    try {
      const dto = ForgotPasswordSchema.parse(req.body);
      await this.service.forgotPassword(
        dto.tenantCode,
        dto.username,
        dto.oldPassword,
        dto.newPassword,
        getClientIp(req) || "unknown",
      );
      success(res, null, "密码重置成功，请重新登录");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/menus")
  @ApiOperation("获取当前用户菜单树")
  async getMyMenus(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = req.user!;
      const data = await this.service.getMyMenus(userId, tenantId);
      success(res, data);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/permissions")
  @ApiOperation("获取当前用户权限列表")
  async getMyPermissions(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = req.user!;
      const data = await this.service.getMyPermissions(userId, tenantId);
      success(res, data);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/switch-tenant")
  @ApiOperation("切换租户")
  @ApiBody(z.object({ tenantId: z.string().uuid() }))
  async switchTenant(@Req() req: Request, @Res() res: Response) {
    try {
      const userId = req.user!.userId;
      const fromTenantId = req.user!.tenantId;
      const deviceId = (req as any).deviceId;
      const { tenantId } = req.body;
      const data = await this.service.switchTenant(
        userId,
        fromTenantId,
        tenantId,
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
      const data = await this.service.listTenants(req.user!.userId);
      success(res, data);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/register")
  @ApiOperation("用户注册")
  @ApiBody(RegisterSchema)
  async register(@Req() req: Request, @Res() res: Response) {
    try {
      const dto = RegisterSchema.parse(req.body);
      let tenant = await this.userRepository.findTenantByCode(dto.tenantCode);
      if (!tenant) {
        tenant = await this.userRepository.createTenant({
          tenantCode: dto.tenantCode,
          tenantName: dto.tenantName,
        });
      } else {
        if (tenant.tenant_name !== dto.tenantName) {
          throw new AppError("租户名称与编码不匹配", 400001, 400);
        }
        if (tenant.status !== "1")
          throw new AppError("该租户已被禁用", 403001, 403);
        if (tenant.expire_time && new Date(tenant.expire_time) < new Date()) {
          throw new AppError("该租户已过期", 403001, 403);
        }
      }

      const user = await this.userRepository.registerUserInTenant({
        tenantId: tenant.tenant_id,
        tenantName: tenant.tenant_name,
        username: dto.username,
        password: dto.password,
        email: dto.email,
        phone: dto.phone,
      });

      const { prisma } = await import("@/config/database.js");
      const userCount = await prisma.sys_user.count({
        where: { tenant_id: tenant.tenant_id, is_deleted: 0 },
      });
      if (userCount === 1) {
        try {
          await this.userRepository.initTenantData(
            tenant.tenant_id,
            user.user_id,
          );
        } catch {}
      }

      success(
        res,
        {
          tenantId: tenant.tenant_id,
          userId: user.user_id,
          username: user.username,
          isNewTenant: userCount === 1,
        },
        "注册成功",
      );
    } catch (err) {
      this.handleError(res, err);
    }
  }

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
    const { error } = require("@/common/utils/response.js");
    if (err instanceof AppError)
      return error(res, err.message, err.code, err.statusCode);
    const { logger } = require("@core/logger/index.js");
    logger.error({ err }, "AuthController error");
    error(res, "操作失败", 500, 500);
  }
}
