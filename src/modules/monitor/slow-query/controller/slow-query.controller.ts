import {
  Controller,
  Get,
  Put,
  Req,
  Res,
  ApiOperation,
  ApiBody,
  ApiQuery,
  ApiResponse,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { SlowQueryService } from "../service/index.js";
import { AppError } from "@/core/errors.js";
import { success, pageSuccess, error } from "@/shared/http/response.js";
import { logger } from "@/platform/logger/index.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import { SlowQueryListSchema, SlowQueryReviewSchema } from "../schema.js";

interface AuthUser {
  userId: string;
  tenantId: string;
}

@Controller("/monitor/slow-query", { tags: ["慢查询"] })
export default class SlowQueryController {
  private service = new SlowQueryService();

  @Get("/list")
  @RequirePermission("monitor:slow-query:list")
  @ApiOperation("慢查询列表")
  @ApiQuery(SlowQueryListSchema)
  async list(@Req() req: Request, @Res() res: Response) {
    try {
      const dto = SlowQueryListSchema.parse(req.query);
      const data = await this.service.list(dto);
      pageSuccess(res, data.list, data.total, data.pageNum, data.pageSize);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/stats")
  @RequirePermission("monitor:slow-query:list")
  @ApiOperation("慢查询概览")
  async stats(@Req() _req: Request, @Res() res: Response) {
    try {
      success(res, await this.service.stats());
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/:id")
  @RequirePermission("monitor:slow-query:list")
  @ApiOperation("慢查询详情（含索引建议）")
  async detail(@Req() req: Request, @Res() res: Response) {
    try {
      success(res, await this.service.detail(req.params.id));
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Put("/:id/review")
  @RequirePermission("monitor:slow-query:review")
  @ApiOperation("标记慢查询（已解决 / 忽略）")
  @ApiBody(SlowQueryReviewSchema)
  async review(@Req() req: Request, @Res() res: Response) {
    try {
      const user = req.user as AuthUser | undefined;
      if (!user?.userId) throw new AppError("未认证", 401001, 401);

      const dto = SlowQueryReviewSchema.parse(req.body);
      const result = await this.service.review(
        req.params.id,
        dto.status,
        dto.note,
        user.userId,
      );
      success(res, result, "标记成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  private handleError(res: Response, err: unknown): void {
    if (res.headersSent) return;
    if (err instanceof AppError) {
      error(res, err.message, err.code, err.statusCode);
      return;
    }
    logger.error({ err }, "[SlowQuery] error");
    error(res, "操作失败", 500, 500);
  }
}
