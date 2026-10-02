import {
  Controller,
  Get,
  Req,
  Res,
  ApiOperation,
  ApiQuery,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { z } from "zod";
import { LoginSecurityRepository } from "../repository.js";
import { LoginSecurityService } from "../service/index.js";
import { AppError } from "@/core/errors.js";
import { success, pageSuccess, error } from "@/shared/http/response.js";
import { logger } from "@/platform/logger/index.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import { MyLoginLogListSchema, AbnormalLogListSchema } from "../schema.js";

interface AuthUser {
  userId: string;
  tenantId: string;
}

@Controller("/login-security", { tags: ["登录安全"] })
export default class LoginSecurityController {
  private repo = new LoginSecurityRepository();
  private service = new LoginSecurityService(this.repo);

  /* ============================================================
   * 用户侧：我的登录记录
   * ============================================================ */
  @Get("/my/logs")
  @ApiOperation("我的登录记录")
  @ApiQuery(MyLoginLogListSchema)
  async myLogs(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const dto = MyLoginLogListSchema.parse(req.query);
      const data = await this.service.listMyLoginLogs(userId, tenantId, {
        pageNum: dto.pageNum,
        pageSize: dto.pageSize,
        onlyAbnormal: dto.onlyAbnormal === 1,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
      });
      pageSuccess(res, data.list, data.total, data.pageNum, data.pageSize);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/my/abnormal")
  @ApiOperation("我的异常登录记录")
  @ApiQuery(MyLoginLogListSchema)
  async myAbnormal(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const dto = MyLoginLogListSchema.parse(req.query);
      const data = await this.service.listMyLoginLogs(userId, tenantId, {
        pageNum: dto.pageNum,
        pageSize: dto.pageSize,
        onlyAbnormal: true,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
      });
      pageSuccess(res, data.list, data.total, data.pageNum, data.pageSize);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * 管理侧：租户内所有异常登录
   * ============================================================ */
  @Get("/abnormal/list")
  @RequirePermission("login-security:list-abnormal")
  @ApiOperation("异常登录记录（管理员）")
  @ApiQuery(AbnormalLogListSchema)
  async abnormalList(@Req() req: Request, @Res() res: Response) {
    try {
      const { tenantId } = this.getAuth(req);
      const dto = AbnormalLogListSchema.parse(req.query);
      const data = await this.service.listAbnormalLogs(tenantId, {
        pageNum: dto.pageNum,
        pageSize: dto.pageSize,
        userId: dto.userId,
        abnormalType: dto.abnormalType,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
      });
      pageSuccess(res, data.list, data.total, data.pageNum, data.pageSize);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/abnormal/stats")
  @RequirePermission("login-security:list-abnormal")
  @ApiOperation("异常登录统计")
  @ApiQuery(
    z.object({
      days: z.coerce.number().int().min(1).max(365).default(30),
    }),
  )
  async abnormalStats(@Req() req: Request, @Res() res: Response) {
    try {
      const { tenantId } = this.getAuth(req);
      const days = Number(req.query.days) || 30;
      success(res, await this.service.stats(tenantId, days));
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * 工具
   * ============================================================ */
  private getAuth(req: Request): { userId: string; tenantId: string } {
    const user = req.user as AuthUser | undefined;
    if (!user?.userId) throw new AppError("未认证", 401001, 401);
    const tenantId = req.tenantId || user.tenantId;
    if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);
    return { userId: user.userId, tenantId };
  }

  private handleError(res: Response, err: unknown): void {
    if (res.headersSent) return;
    if (err instanceof AppError) {
      error(res, err.message, err.code, err.statusCode);
      return;
    }
    logger.error({ err }, "[LoginSecurity] error");
    error(res, "操作失败", 500, 500);
  }
}
