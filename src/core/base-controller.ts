import { Request, Response } from "express";
import { z, ZodTypeAny } from "zod";
import dayjs from "dayjs";
import { success, pageSuccess, error } from "@/common/utils/response.js";
import {
  keysToCamelCase,
  keysToSnakeCase,
} from "@/common/utils/case-convert.js";
import { BaseRepository } from "./base-repository.js";
import {
  IControllerHooks,
  BaseControllerConfig,
} from "@/types/base-controller.js";
import { BaseQuery } from "@/types/base-repository.js";
import { AppError } from "@/core/errors.js";
import { Req, Res } from "./decorator/index.js";
import { logger } from "@core/logger/index.js";

export abstract class BaseController<
  T,
  CreateDto extends Record<string, unknown>,
  UpdateDto extends Record<string, unknown>,
  QueryDto extends BaseQuery,
> implements IControllerHooks<T, CreateDto, UpdateDto, QueryDto> {
  protected abstract readonly repository: BaseRepository<T, any, any, any>;
  protected abstract readonly config: BaseControllerConfig;
  protected abstract readonly createSchema?: ZodTypeAny;
  protected abstract readonly updateSchema?: ZodTypeAny;

  protected readonly querySchema: ZodTypeAny = z.object({
    pageNum: z.number().default(1),
    pageSize: z.number().default(10),
    keyword: z.string().optional(),
    status: z.string().optional(),
  });

  protected readonly idParamSchema = z.object({
    id: z.string().uuid(),
  });

  // ==================== 钩子 ====================

  async beforeList(query: QueryDto, _req: Request): Promise<QueryDto> {
    return query;
  }

  async afterList(data: T[], _req: Request): Promise<T[]> {
    return data.map((item: any) => {
      const camel = keysToCamelCase<any>(item);
      for (const key in camel) {
        if (camel[key] instanceof Date) {
          camel[key] = dayjs(camel[key]).format("YYYY-MM-DD HH:mm:ss");
        }
        if (this.config.hiddenFields?.includes(key)) {
          delete camel[key];
        }
      }
      return camel as T;
    });
  }

  async beforeCreate(dto: CreateDto, _req: Request): Promise<CreateDto> {
    return dto;
  }

  async afterCreate(data: T, _req: Request): Promise<T> {
    const camel = keysToCamelCase<any>(data);
    for (const key in camel) {
      if (camel[key] instanceof Date) {
        camel[key] = dayjs(camel[key]).format("YYYY-MM-DD HH:mm:ss");
      }
      if (this.config.hiddenFields?.includes(key)) delete camel[key];
    }
    return camel as T;
  }

  async beforeUpdate(
    id: string,
    dto: UpdateDto,
    _req: Request,
  ): Promise<UpdateDto> {
    return dto;
  }

  async afterUpdate(data: T, _req: Request): Promise<T> {
    const camel = keysToCamelCase<any>(data);
    for (const key in camel) {
      if (camel[key] instanceof Date) {
        camel[key] = dayjs(camel[key]).format("YYYY-MM-DD HH:mm:ss");
      }
    }
    return camel as T;
  }

  async beforeDelete(_id: string, _req: Request): Promise<boolean> {
    return true;
  }

  async afterDelete(_id: string, _req: Request): Promise<void> {}

  async beforeDetail(_id: string, _req: Request): Promise<void> {}

  async afterDetail(data: T, _req: Request): Promise<T> {
    const camel = keysToCamelCase<any>(data);
    for (const key in camel) {
      if (camel[key] instanceof Date) {
        camel[key] = dayjs(camel[key]).format("YYYY-MM-DD HH:mm:ss");
      }
      if (this.config.hiddenFields?.includes(key)) delete camel[key];
    }
    return camel as T;
  }

  // ==================== 通用方法 ====================

  async list(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);

      this.repository.setDataScope((req as any).dataScopeWhere ?? {});

      let query = this.parseQueryParams(req.query) as QueryDto;
      query.tenantId = tenantId;
      query = await this.beforeList(query, req);

      const where = this.buildListWhere(query);
      const result = await this.repository.findPage(query, where);
      result.list = await this.afterList(result.list, req);

      pageSuccess(
        res,
        result.list,
        result.total,
        result.pageNum,
        result.pageSize,
      );
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async detail(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);

      this.repository.setDataScope((req as any).dataScopeWhere ?? {}); // ⭐
      await this.beforeDetail(id, req);

      const data = await this.repository.findById(id, tenantId);
      if (!data) throw new AppError("记录不存在", 404001, 404);

      success(res, await this.afterDetail(data, req));
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async create(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId || req.user?.tenantId; // ⭐ 不再从 body 取
      if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);

      const userId = req.user?.userId;

      let dto = this.parseCreateDto(req.body);
      dto = await this.beforeCreate(dto, req);

      const dbData = keysToSnakeCase(dto); // ⭐ 不再注入 tenantId
      const result = await this.repository.create(dbData, tenantId, userId);

      const created = await this.afterCreate(result, req); // ⭐ 用返回值
      success(res, created, "创建成功", 200);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async update(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);

      const userId = req.user?.userId;

      this.repository.setDataScope((req as any).dataScopeWhere ?? {}); // ⭐
      let dto = this.parseUpdateDto(req.body);
      dto = await this.beforeUpdate(id, dto, req);

      const dbData = keysToSnakeCase(dto);
      const result = await this.repository.update(id, dbData, tenantId, userId);
      await this.afterUpdate(result, req);

      success(res, null, "更新成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async remove(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);

      const userId = req.user?.userId;

      this.repository.setDataScope((req as any).dataScopeWhere ?? {}); // ⭐
      const canDelete = await this.beforeDelete(id, req);
      if (!canDelete) throw new AppError("不满足删除条件", 400001, 400);

      await this.repository.softDelete(id, tenantId, userId);
      await this.afterDelete(id, req);

      success(res, null, "删除成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async batchRemove(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      const tenantId = req.tenantId;
      if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new AppError("请选择要删除的记录", 400001, 400);
      }

      const result = await this.repository.softDeleteMany(
        ids,
        tenantId,
        req.user?.userId,
      );
      success(res, { deletedCount: result.count }, "批量删除成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  // ==================== 工具方法 ====================

  protected parseQueryParams(query: any): QueryDto {
    const pageNum = Math.max(1, parseInt(query.pageNum, 10) || 1);
    const maxSize = this.config.maxPageSize ?? 100;
    const pageSize = Math.min(
      maxSize,
      Math.max(
        1,
        parseInt(query.pageSize, 10) || this.config.defaultPageSize || 10,
      ),
    );
    return { ...query, pageNum, pageSize } as QueryDto;
  }

  protected parseCreateDto(body: any): CreateDto {
    return body as CreateDto;
  }

  protected parseUpdateDto(body: any): UpdateDto {
    return body as UpdateDto;
  }

  protected buildListWhere(query: QueryDto): any {
    const where: any = {};
    if (query.status !== undefined) where.status = query.status;
    return where;
  }

  protected handleError(@Res() res: Response, err: unknown): void {
    if (err instanceof AppError) {
      error(res, err.message, err.code, err.statusCode);
      return;
    }
    logger.error({ err }, "Controller error"); // ⭐ logger
    error(res, "操作失败", 500, 500);
  }

  protected getPermission(action: string): string {
    return `${this.config.permissionPrefix}:${action}`;
  }
}
