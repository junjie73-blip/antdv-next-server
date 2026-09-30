import {
  Controller,
  Get,
  Put,
  Req,
  Res,
  ApiOperation,
  ApiBody,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { success } from "@/shared/http/response.js";
import { AppError } from "@/core/errors.js";
import { SettingsService } from "./service.js";
import {
  PasswordPolicySchema,
  SiteInfoSchema,
  UploadConfigSchema,
} from "./schema.js";

interface AuthUser {
  userId: string;
  tenantId: string;
}

@Controller("/settings", { tags: ["系统配置"] })
export default class SettingsController {
  private service = new SettingsService();

  /* ============================================================
   * ⭐ 网站信息 - 公开接口（前端未登录也能读）
   * ============================================================ */
  @Get("/site-info")
  @ApiOperation("获取网站信息（公开）")
  async siteInfoPublic(@Req() req: Request, @Res() res: Response) {
    // 公开接口：从 Header / Query 拿租户
    const tenantId = (req.headers["x-tenant-id"] as string) || req.tenantId;
    if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);
    return success(res, await this.service.getSiteInfo(tenantId));
  }

  /* ============================================================
   * ⭐ 网站信息 - 更新（需登录 + 权限）
   * ============================================================ */
  @Put("/site-info")
  @ApiOperation("更新网站信息")
  @ApiBody(SiteInfoSchema)
  async updateSiteInfo(@Req() req: Request, @Res() res: Response) {
    const { userId, tenantId } = req.user as AuthUser;
    const dto = SiteInfoSchema.parse(req.body);
    await this.service.updateSiteInfo(tenantId, dto, userId);
    return success(res, null, "保存成功");
  }

  /* ============================================================
   * ⭐ 密码策略
   * ============================================================ */
  @Get("/password-policy")
  @ApiOperation("获取密码策略")
  async getPasswordPolicy(@Req() req: Request, @Res() res: Response) {
    const { tenantId } = req.user as AuthUser;
    return success(res, await this.service.getPasswordPolicy(tenantId));
  }

  @Put("/password-policy")
  @ApiOperation("更新密码策略")
  @ApiBody(PasswordPolicySchema)
  async updatePasswordPolicy(@Req() req: Request, @Res() res: Response) {
    const { userId, tenantId } = req.user as AuthUser;
    const dto = PasswordPolicySchema.parse(req.body);
    await this.service.updatePasswordPolicy(tenantId, dto, userId);
    return success(res, null, "保存成功");
  }

  /* ============================================================
   * ⭐ 上传配置
   * ============================================================ */
  @Get("/upload-config")
  @ApiOperation("获取上传配置")
  async getUploadConfig(@Req() req: Request, @Res() res: Response) {
    const { tenantId } = req.user as AuthUser;
    return success(res, await this.service.getUploadConfig(tenantId));
  }

  @Put("/upload-config")
  @ApiOperation("更新上传配置")
  @ApiBody(UploadConfigSchema)
  async updateUploadConfig(@Req() req: Request, @Res() res: Response) {
    const { userId, tenantId } = req.user as AuthUser;
    const dto = UploadConfigSchema.parse(req.body);
    await this.service.updateUploadConfig(tenantId, dto, userId);
    return success(res, null, "保存成功");
  }
}
