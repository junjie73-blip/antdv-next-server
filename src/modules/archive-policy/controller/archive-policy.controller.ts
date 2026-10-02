import {
  Controller,
  Get,
  Put,
  Post,
  Req,
  Res,
  ApiOperation,
  ApiBody,
  ApiQuery,
  ApiResponse,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { ArchivePolicyRepository } from "../repository.js";
import { ArchivePolicyService } from "../service/index.js";
import { AppError } from "@/core/errors.js";
import { success, pageSuccess, error } from "@/shared/http/response.js";
import { logger } from "@/platform/logger/index.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import {
  ArchivePolicyUpdateSchema,
  ArchiveTriggerSchema,
  ArchiveLogListSchema,
} from "../schema.js";
import { ALLOWED_TABLES } from "../constants.js";

interface AuthUser {
  userId: string;
  tenantId: string;
}

@Controller("/archive-policy", { tags: ["数据归档"] })
export default class ArchivePolicyController {
  private repo = new ArchivePolicyRepository();
  private service = new ArchivePolicyService(this.repo);

  /* ============================================================
   * 策略列表 / 详情
   * ============================================================ */
  @Get("/list")
  @RequirePermission("archive:policy:list")
  @ApiOperation("归档策略列表")
  @ApiResponse(200, "查询成功")
  async list(@Req() _req: Request, @Res() res: Response) {
    try {
      success(res, await this.service.list());
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/table/:tableName")
  @RequirePermission("archive:policy:list")
  @ApiOperation("查询单表归档策略")
  async getOne(@Req() req: Request, @Res() res: Response) {
    try {
      const tableName = req.params.tableName;
      if (!ALLOWED_TABLES.has(tableName)) {
        throw new AppError("表名不在白名单中", 400001, 400);
      }
      success(res, await this.service.getByTableName(tableName));
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * 更新策略
   * ============================================================ */
  @Put("/table/:tableName")
  @RequirePermission("archive:policy:update")
  @ApiOperation("更新归档策略")
  @ApiBody(ArchivePolicyUpdateSchema)
  async update(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId } = this.getAuth(req);
      const tableName = req.params.tableName;
      if (!ALLOWED_TABLES.has(tableName)) {
        throw new AppError("表名不在白名单中", 400001, 400);
      }
      const dto = ArchivePolicyUpdateSchema.parse(req.body);
      await this.service.update(tableName, dto, userId);
      success(res, null, "更新成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * 手动触发
   * ============================================================ */
  @Post("/trigger")
  @RequirePermission("archive:policy:trigger")
  @ApiOperation("手动触发归档", "dryRun=true 时只统计不删除")
  @ApiBody(ArchiveTriggerSchema)
  async trigger(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId } = this.getAuth(req);
      const dto = ArchiveTriggerSchema.parse(req.body);
      const result = await this.service.trigger(dto, userId);
      success(res, result, dto.dryRun ? "试运行完成" : "归档完成");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * 执行日志
   * ============================================================ */
  @Get("/logs")
  @RequirePermission("archive:log:list")
  @ApiOperation("归档执行日志")
  @ApiQuery(ArchiveLogListSchema)
  async logs(@Req() req: Request, @Res() res: Response) {
    try {
      const dto = ArchiveLogListSchema.parse(req.query);
      const data = await this.service.listLogs(dto);
      pageSuccess(res, data.list, data.total, data.pageNum, data.pageSize);
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
    logger.error({ err }, "[ArchivePolicy] error");
    error(res, "操作失败", 500, 500);
  }
}
