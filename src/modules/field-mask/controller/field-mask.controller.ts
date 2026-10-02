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
import { FieldMaskService } from "../service/field-mask.service.js";
import { AppError } from "@/core/errors.js";
import { success, pageSuccess, error } from "@/shared/http/response.js";
import { logger } from "@/platform/logger/index.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import {
  FieldMaskCreateSchema,
  FieldMaskUpdateSchema,
  FieldMaskListSchema,
} from "../schema.js";

interface AuthUser {
  userId: string;
  tenantId: string;
}

@Controller("/field-mask", { tags: ["字段脱敏"] })
export default class FieldMaskController {
  private service = new FieldMaskService();

  @Get("/list")
  @RequirePermission("system:field-mask:list")
  @ApiOperation("脱敏策略列表")
  @ApiQuery(FieldMaskListSchema)
  async list(@Req() req: Request, @Res() res: Response) {
    try {
      const { tenantId } = this.getAuth(req);
      const dto = FieldMaskListSchema.parse(req.query);
      const data = await this.service.list(tenantId, dto);
      pageSuccess(res, data.list, data.total, data.pageNum, data.pageSize);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/:id")
  @RequirePermission("system:field-mask:list")
  @ApiOperation("脱敏策略详情")
  async detail(@Req() req: Request, @Res() res: Response) {
    try {
      const { tenantId } = this.getAuth(req);
      success(res, await this.service.detail(req.params.id, tenantId));
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/")
  @RequirePermission("system:field-mask:manage")
  @ApiOperation("创建脱敏策略")
  @ApiBody(FieldMaskCreateSchema)
  async create(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const dto = FieldMaskCreateSchema.parse(req.body);
      const data = await this.service.create(dto, tenantId, userId);
      success(res, data, "创建成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Put("/:id")
  @RequirePermission("system:field-mask:manage")
  @ApiOperation("更新脱敏策略")
  @ApiBody(FieldMaskUpdateSchema)
  async update(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const dto = FieldMaskUpdateSchema.parse(req.body);
      await this.service.update(req.params.id, dto, tenantId, userId);
      success(res, null, "更新成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Delete("/:id")
  @RequirePermission("system:field-mask:manage")
  @ApiOperation("删除脱敏策略")
  async remove(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      await this.service.remove(req.params.id, tenantId, userId);
      success(res, null, "删除成功");
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
    logger.error({ err }, "[FieldMask] error");
    error(res, "操作失败", 500, 500);
  }
}
