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
import { StorageHealthService } from "../service/storage-health.service.js";
import { AppError } from "@/core/errors.js";
import { success, pageSuccess, error } from "@/shared/http/response.js";
import { logger } from "@/platform/logger/index.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import {
  StorageBackendCreateSchema,
  StorageBackendUpdateSchema,
  StorageBackendListSchema,
  StorageBackendActivateSchema,
} from "../schema.js";
import { StorageBackendService } from "../service/storage-backend.service.js";

interface AuthUser {
  userId: string;
  tenantId: string;
}

@Controller("/storage-backend", { tags: ["存储后端"] })
export default class StorageBackendController {
  private service = new StorageBackendService();
  private health = new StorageHealthService();

  @Get("/list")
  @ApiOperation("存储后端列表")
  @ApiQuery(StorageBackendListSchema)
  async list(@Req() req: Request, @Res() res: Response) {
    try {
      const { tenantId } = this.getAuth(req);
      const dto = StorageBackendListSchema.parse(req.query);
      const data = await this.service.list(tenantId, dto);
      pageSuccess(res, data.list, data.total, data.pageNum, data.pageSize);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/:id")
  @ApiOperation("存储后端详情")
  async detail(@Req() req: Request, @Res() res: Response) {
    try {
      const { tenantId } = this.getAuth(req);
      success(res, await this.service.detail(req.params.id, tenantId));
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/")
  @ApiOperation("创建存储后端")
  @ApiBody(StorageBackendCreateSchema)
  async create(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const dto = StorageBackendCreateSchema.parse(req.body);
      const data = await this.service.create(dto, tenantId, userId);
      success(res, data, "创建成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Put("/:id")
  @ApiOperation("更新存储后端")
  @ApiBody(StorageBackendUpdateSchema)
  async update(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const dto = StorageBackendUpdateSchema.parse(req.body);
      await this.service.update(req.params.id, dto, tenantId, userId);
      success(res, null, "更新成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/activate")
  @ApiOperation("激活存储后端（热切换）")
  @ApiBody(StorageBackendActivateSchema)
  async activate(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      const { backendId } = StorageBackendActivateSchema.parse(req.body);
      await this.service.activate(backendId, tenantId, userId);
      success(res, null, "激活成功，后续上传将使用该存储");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Delete("/:id")
  @ApiOperation("删除存储后端")
  async remove(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getAuth(req);
      await this.service.remove(req.params.id, tenantId, userId);
      success(res, null, "删除成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/:id/check")
  @ApiOperation("手动触发健康检查")
  async check(@Req() req: Request, @Res() res: Response) {
    try {
      const { tenantId } = this.getAuth(req);
      const b = await this.service.detail(req.params.id, tenantId);
      await this.health.checkOne(b as any, tenantId);
      const updated = await this.service.detail(req.params.id, tenantId);
      success(res, updated, "检查完成");
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
    logger.error({ err }, "[StorageBackend] error");
    error(res, "操作失败", 500, 500);
  }
}
