import {
  Controller,
  Get,
  Put,
  Post,
  Req,
  Res,
  ApiOperation,
  ApiBody,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { AppError } from "@/core/errors.js";
import { success, error } from "@/shared/http/response.js";
import { logger } from "@/platform/logger/index.js";
import { PreferenceBatchSetSchema, PreferenceResetSchema } from "../schema.js";
import { NoticePreferenceService } from "../service/preference.service.js";

interface AuthUser {
  userId: string;
  tenantId: string;
}

@Controller("/notice-preference", { tags: ["通知偏好"] })
export default class NoticePreferenceController {
  private service = new NoticePreferenceService();

  @Get("/me")
  @ApiOperation("获取我的通知偏好")
  async getMine(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      success(res, await this.service.getUserPreferences(userId, tenantId));
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Put("/me")
  @ApiOperation("批量设置通知偏好")
  @ApiBody(PreferenceBatchSetSchema)
  async setMine(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const dto = PreferenceBatchSetSchema.parse(req.body);
      await this.service.setPreferences(userId, tenantId, dto);
      success(res, null, "保存成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/me/reset")
  @ApiOperation("重置通知偏好（默认值）")
  @ApiBody(PreferenceResetSchema)
  async resetMine(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const dto = PreferenceResetSchema.parse(req.body ?? {});
      await this.service.reset(userId, tenantId, dto.channel);
      success(res, null, "已重置");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  private getAuth(req: Request) {
    const user = req.user as AuthUser | undefined;
    if (!user?.userId) throw new AppError("未认证", 401001, 401);
    const tenantId = req.tenantId || user.tenantId;
    if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);
    return { userId: user.userId, tenantId };
  }

  private handleError(res: Response, err: unknown) {
    if (res.headersSent) return;
    if (err instanceof AppError)
      return error(res, err.message, err.code, err.statusCode);
    logger.error({ err }, "[NoticePreference] error");
    error(res, "操作失败", 500, 500);
  }
}
