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
import { AppError } from "@/core/errors.js";
import { success, pageSuccess, error } from "@/shared/http/response.js";
import { logger } from "@/platform/logger/index.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import {
  TemplateCreateSchema,
  TemplateUpdateSchema,
  TemplateListSchema,
  TemplateRollbackSchema,
} from "../schema.js";
import { GenTemplateService } from "../service/template.service.js";

interface AuthUser {
  userId: string;
  tenantId: string;
}

@Controller("/generator/template", { tags: ["代码生成器模板"] })
export default class GenTemplateController {
  private service = new GenTemplateService();

  @Get("/list")
  @ApiOperation("模板列表")
  @ApiQuery(TemplateListSchema)
  async list(@Req() req: Request, @Res() res: Response) {
    try {
      const { tenantId } = this.getAuth(req);
      const dto = TemplateListSchema.parse(req.query);
      const data = await this.service.list(tenantId, dto);
      pageSuccess(res, data.list, data.total, data.pageNum, data.pageSize);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/:id")
  @ApiOperation("模板详情（含版本列表）")
  async detail(@Req() req: Request, @Res() res: Response) {
    try {
      const { tenantId } = this.getAuth(req);
      success(res, await this.service.detail(req.params.id, tenantId));
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/")
  @ApiOperation("创建模板")
  @ApiBody(TemplateCreateSchema)
  async create(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const dto = TemplateCreateSchema.parse(req.body);
      const data = await this.service.create(dto, tenantId, userId);
      success(res, data, "创建成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Put("/:id")
  @ApiOperation("更新模板（内容变更自动创建新版本）")
  @ApiBody(TemplateUpdateSchema)
  async update(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const dto = TemplateUpdateSchema.parse(req.body);
      await this.service.update(req.params.id, dto, tenantId, userId);
      success(res, null, "更新成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/:id/rollback")
  @ApiOperation("回滚到指定版本")
  @ApiBody(TemplateRollbackSchema)
  async rollback(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const { version } = TemplateRollbackSchema.parse(req.body);
      await this.service.rollback(req.params.id, version, tenantId, userId);
      success(res, null, "已回滚");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Delete("/:id")
  @ApiOperation("删除模板")
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
    logger.error({ err }, "[GenTemplate] error");
    error(res, "操作失败", 500, 500);
  }
}
