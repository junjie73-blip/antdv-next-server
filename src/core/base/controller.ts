import { Request, Response } from "express";
import { z, ZodTypeAny } from "zod";
import dayjs from "dayjs";
import { success, pageSuccess, error } from "@/common/utils/response.js";
import {
  keysToCamelCase,
  keysToSnakeCase,
} from "@/common/utils/case-convert.js";
import { BaseRepository } from "./repository.js";
import { BaseService } from "./service.js";
import {
  IControllerHooks,
  BaseControllerConfig,
} from "@/types/base-controller.js";
import { BaseQuery } from "@/types/base-repository.js";
import { AppError } from "@/core/errors.js";
import { Req, Res } from "../decorator/index.js";
import { logger } from "@core/logger/index.js";
import { forIn } from "es-toolkit/compat";

export abstract class BaseController<
  T,
  CreateDto extends Record<string, unknown>,
  UpdateDto extends Record<string, unknown>,
  QueryDto extends BaseQuery,
> implements IControllerHooks<T, CreateDto, UpdateDto, QueryDto> {
  /** 数据访问（必需） */
  protected abstract readonly repository: BaseRepository<T, any, any, any>;

  /**
   * 业务服务（可选）
   * - 简单 CRUD 不实现
   * - 复杂业务实现，Controller 会优先调用 service 的方法
   */
  protected readonly service?: BaseService<any>;

  /** 控制器配置（必需） */
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
    return this.transformList(data);
  }

  async beforeCreate(dto: CreateDto, _req: Request): Promise<CreateDto> {
    return dto;
  }

  async afterCreate(data: T, _req: Request): Promise<T> {
    return this.transformOne(data);
  }

  async beforeUpdate(
    id: string,
    dto: UpdateDto,
    _req: Request,
  ): Promise<UpdateDto> {
    return dto;
  }

  async afterUpdate(data: T, _req: Request): Promise<T> {
    return this.transformOne(data);
  }

  async beforeDelete(_id: string, _req: Request): Promise<boolean> {
    return true;
  }

  async afterDelete(_id: string, _req: Request): Promise<void> {}

  async beforeDetail(_id: string, _req: Request): Promise<void> {}

  async afterDetail(data: T, _req: Request): Promise<T> {
    return this.transformOne(data);
  }

  // ==================== 通用 CRUD ====================

  async list(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);

      // ⭐ beforeList 先执行（业务可能想改 dataScope）
      let query = this.parseQueryParams(req.query) as QueryDto;
      query.tenantId = tenantId;
      query = await this.beforeList(query, req);

      // ⭐ 再设置 dataScope
      this.repository.setDataScope((req as any).dataScopeWhere ?? {});

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

      this.repository.setDataScope((req as any).dataScopeWhere ?? {});
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
      const tenantId = req.tenantId || req.user?.tenantId;
      if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);

      const userId = req.user?.userId;

      let dto = this.parseCreateDto(req.body);
      dto = await this.beforeCreate(dto, req);

      // ⭐ 只转顶层 key，避免嵌套对象被误伤
      const dbData = keysToSnakeCase(dto);
      const result = await this.repository.create(dbData, tenantId, userId);
      const created = await this.afterCreate(result, req);
      success(res, created, "创建成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async update(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);

      this.repository.setDataScope((req as any).dataScopeWhere ?? {});
      let dto = this.parseUpdateDto(req.body);
      dto = await this.beforeUpdate(id, dto, req);

      const dbData = keysToSnakeCase(dto);
      const result = await this.repository.update(
        id,
        dbData,
        tenantId,
        req.user?.userId,
      );
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

      this.repository.setDataScope((req as any).dataScopeWhere ?? {});
      const canDelete = await this.beforeDelete(id, req);
      if (!canDelete) throw new AppError("不满足删除条件", 400001, 400);

      await this.repository.softDelete(id, tenantId, req.user?.userId);
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
    forIn(query, (value, key) => {
      if (!["pageSize", "pageNum", "fields"].includes(key)) {
        where[key] = value;
      }
    });
    return keysToSnakeCase(where);
  }

  /**
   * ⭐ 数据转换：单条
   */
  protected transformOne(data: T): T {
    const camel = keysToCamelCase<any>(data);
    for (const key in camel) {
      if (camel[key] instanceof Date) {
        camel[key] = dayjs(camel[key]).format("YYYY-MM-DD HH:mm:ss");
      }
      if (this.config.hiddenFields?.includes(key)) {
        delete camel[key];
      }
    }
    return camel as T;
  }

  /**
   * ⭐ 数据转换：列表
   */
  protected transformList(data: T[]): T[] {
    return data.map((item) => this.transformOne(item));
  }

  /**
   * ⭐ 统一错误处理（去掉 @Res() 装饰器）
   */
  protected handleError(res: Response, err: unknown): void {
    if (err instanceof AppError) {
      error(res, err.message, err.code, err.statusCode);
      return;
    }
    logger.error({ err }, "Controller error");
    error(res, "操作失败", 500, 500);
  }

  protected getPermission(action: string): string {
    return `${this.config.permissionPrefix}:${action}`;
  }
}
