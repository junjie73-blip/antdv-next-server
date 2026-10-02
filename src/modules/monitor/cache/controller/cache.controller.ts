import {
  Controller,
  Get,
  Post,
  Delete,
  Req,
  Res,
  ApiOperation,
  ApiBody,
  ApiQuery,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { z } from "zod";
import { cacheService } from "../service/cache.service.js";
import { cacheOperationService } from "../service/cache-operation.service.js";
import { AppError } from "@/core/errors.js";
import { success, pageSuccess, error } from "@/shared/http/response.js";
import { logger } from "@/platform/logger/index.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import {
  CacheScanSchema,
  CacheClearGroupSchema,
  CacheDeleteKeySchema,
} from "../schema.js";

interface AuthUser {
  userId: string;
  username: string;
  tenantId: string;
}

@Controller("/monitor/cache", { tags: ["缓存管理"] })
export default class CacheController {
  @Get("/overview")
  @RequirePermission("system:cache:manage")
  @ApiOperation("缓存总览（按组统计）")
  async overview(@Req() _req: Request, @Res() res: Response) {
    try {
      success(res, await cacheService.overview());
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/scan")
  @RequirePermission("system:cache:manage")
  @ApiOperation("按 pattern 扫描 key")
  @ApiQuery(CacheScanSchema)
  async scan(@Req() req: Request, @Res() res: Response) {
    try {
      const dto = CacheScanSchema.parse(req.query);
      success(res, await cacheService.scan(dto));
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/key")
  @RequirePermission("system:cache:manage")
  @ApiOperation("查看单 key 详情")
  @ApiQuery(z.object({ key: z.string().min(1).max(512) }))
  async keyDetail(@Req() req: Request, @Res() res: Response) {
    try {
      const key = String(req.query.key ?? "");
      success(res, await cacheService.keyDetail(key));
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/clear-group")
  @RequirePermission("system:cache:manage")
  @ApiOperation("清空缓存组")
  @ApiBody(CacheClearGroupSchema)
  async clearGroup(@Req() req: Request, @Res() res: Response) {
    const { user, tenantId } = this.getAuth(req);
    const t0 = Date.now();
    try {
      const dto = CacheClearGroupSchema.parse(req.body);
      const result = await cacheService.clearGroup(dto);

      await cacheOperationService.recordClearGroup(
        tenantId,
        user.userId,
        user.username,
        dto.group,
        result.cleared,
        Date.now() - t0,
      );

      success(res, result, `已清空 ${result.cleared} 个 key`);
    } catch (err) {
      await cacheOperationService.recordFailure(
        tenantId,
        user.userId,
        user.username,
        "clear_group",
        (req.body as any)?.group ?? "",
        String((err as Error)?.message ?? err),
      );
      this.handleError(res, err);
    }
  }

  @Delete("/key")
  @RequirePermission("system:cache:manage")
  @ApiOperation("删除单个 key")
  @ApiBody(CacheDeleteKeySchema)
  async deleteKey(@Req() req: Request, @Res() res: Response) {
    const { user, tenantId } = this.getAuth(req);
    const t0 = Date.now();
    try {
      const dto = CacheDeleteKeySchema.parse(req.body);
      const result = await cacheService.deleteKey(dto);

      await cacheOperationService.recordDeleteKey(
        tenantId,
        user.userId,
        user.username,
        dto.key,
        result.deleted,
        Date.now() - t0,
      );

      success(res, result, "已删除");
    } catch (err) {
      await cacheOperationService.recordFailure(
        tenantId,
        user.userId,
        user.username,
        "delete_key",
        (req.body as any)?.key ?? "",
        String((err as Error)?.message ?? err),
      );
      this.handleError(res, err);
    }
  }

  @Get("/operations")
  @RequirePermission("system:cache:manage")
  @ApiOperation("缓存操作日志")
  @ApiQuery(
    z.object({
      pageNum: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
    }),
  )
  async operations(@Req() req: Request, @Res() res: Response) {
    try {
      const { tenantId } = this.getAuth(req);
      const pageNum = Number(req.query.pageNum) || 1;
      const pageSize = Number(req.query.pageSize) || 20;
      const data = await cacheOperationService.list(
        tenantId,
        pageNum,
        pageSize,
      );
      pageSuccess(res, data.list, data.total, pageNum, pageSize);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  private getAuth(req: Request) {
    const user = req.user as AuthUser | undefined;
    if (!user?.userId) throw new AppError("未认证", 401001, 401);
    const tenantId = req.tenantId || user.tenantId;
    if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);
    return { user, tenantId };
  }

  private handleError(res: Response, err: unknown): void {
    if (res.headersSent) return;
    if (err instanceof AppError)
      return error(res, err.message, err.code, err.statusCode);
    logger.error({ err }, "[Cache] error");
    error(res, "操作失败", 500, 500);
  }
}
