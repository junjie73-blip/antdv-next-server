import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Req,
  Res,
  ApiOperation,
  ApiBody,
  ApiQuery,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { z } from "zod";
import { success, pageSuccess, error } from "@/shared/http/response.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { WfDelegateService } from "../service/delegate.service.js";
import {
  WfDelegateCreateSchema,
  WfDelegateUpdateSchema,
  WfDelegateListSchema,
} from "../schema.js";
import { prisma } from "@/config/index.js";

interface AuthUser {
  userId: string;
  tenantId: string;
}

@Controller("/workflow/delegate", { tags: ["工作流-委托"] })
export default class WfDelegateController {
  private service = new WfDelegateService();

  /* ============================================================
   * 我的委托（作为委托人）
   * ============================================================ */
  @Get("/mine")
  @ApiOperation("我创建的委托")
  @ApiQuery(
    z.object({
      pageNum: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(10),
    }),
  )
  async mine(@Req() req: Request, @Res() res: Response) {
    try {
      const user = this.getAuth(req);
      const pageNum = Number(req.query.pageNum) || 1;
      const pageSize = Number(req.query.pageSize) || 10;
      const data = await this.service.myDelegations(
        user.userId,
        user.tenantId,
        {
          pageNum,
          pageSize,
        },
      );
      pageSuccess(res, data.list, data.total, data.pageNum, data.pageSize);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * 我代理的（作为被委托人）
   * ============================================================ */
  @Get("/acting")
  @ApiOperation("我代理的委托")
  @ApiQuery(
    z.object({
      pageNum: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(10),
    }),
  )
  async acting(@Req() req: Request, @Res() res: Response) {
    try {
      const user = this.getAuth(req);
      const pageNum = Number(req.query.pageNum) || 1;
      const pageSize = Number(req.query.pageSize) || 10;
      const data = await this.service.myActing(user.userId, user.tenantId, {
        pageNum,
        pageSize,
      });
      pageSuccess(res, data.list, data.total, data.pageNum, data.pageSize);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * 管理侧：全租户列表
   * ============================================================ */
  @Get("/list")
  @ApiOperation("委托规则列表（管理员）")
  @ApiQuery(WfDelegateListSchema)
  async list(@Req() req: Request, @Res() res: Response) {
    try {
      const user = this.getAuth(req);
      const dto = WfDelegateListSchema.parse(req.query);
      const data = await this.service.list(user.tenantId, dto);
      pageSuccess(res, data.list, data.total, data.pageNum, data.pageSize);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/:id")
  @ApiOperation("委托详情")
  async detail(@Req() req: Request, @Res() res: Response) {
    try {
      const user = this.getAuth(req);
      const data = await this.service.detail(req.params.id, user.tenantId);
      success(res, data);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * 创建
   * ============================================================ */
  @Post("/")
  @ApiOperation("创建委托规则")
  @ApiBody(WfDelegateCreateSchema)
  async create(@Req() req: Request, @Res() res: Response) {
    try {
      const user = this.getAuth(req);
      const dto = WfDelegateCreateSchema.parse(req.body);
      const data = await this.service.create(
        user.tenantId,
        user.userId,
        dto,
        user.userId,
      );
      success(res, data, "创建成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * 更新
   * ============================================================ */
  @Put("/:id")
  @ApiOperation("更新委托规则")
  @ApiBody(WfDelegateUpdateSchema)
  async update(@Req() req: Request, @Res() res: Response) {
    try {
      const user = this.getAuth(req);
      const dto = WfDelegateUpdateSchema.parse(req.body);
      await this.service.update(req.params.id, user.tenantId, dto, user.userId);
      success(res, null, "更新成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * 撤销（立即失效）
   * ============================================================ */
  @Post("/:id/revoke")
  @ApiOperation("立即撤销委托")
  async revoke(@Req() req: Request, @Res() res: Response) {
    try {
      const user = this.getAuth(req);
      await this.service.revoke(req.params.id, user.tenantId, user.userId);
      success(res, null, "已撤销");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * 删除
   * ============================================================ */
  @Delete("/:id")
  @ApiOperation("删除委托规则")
  async remove(@Req() req: Request, @Res() res: Response) {
    try {
      const user = this.getAuth(req);
      await this.service.remove(req.params.id, user.tenantId, user.userId);
      success(res, null, "删除成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }
  @Get("/:id/logs")
  @ApiOperation("委托生效日志")
  async logs(@Req() req: Request, @Res() res: Response) {
    try {
      const user = this.getAuth(req);
      const rows = await prisma.wf_task_transfer_log.findMany({
        where: {
          tenant_id: user.tenantId,
          action_type: "delegate",
          metadata: { path: ["delegateId"], equals: req.params.id },
        },
        orderBy: { created_at: "desc" },
        take: 200,
      });
      success(res, rows);
    } catch (err) {
      this.handleError(res, err);
    }
  }
  private getAuth(req: Request): AuthUser {
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
    logger.error({ err }, "[WfDelegate] error");
    error(res, "操作失败", 500, 500);
  }
}
