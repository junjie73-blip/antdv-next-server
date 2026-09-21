import { Request, Response } from "express";
import { z, ZodTypeAny } from "zod";
import dayjs from "dayjs";
import { success, pageSuccess, error } from "@/shared/http/response.js";
import {
  keysToCamelCase,
  keysToSnakeCase,
} from "@/shared/utils/case-convert.js";
import { BaseRepository, BaseQuery } from "./repository.js";
import { BaseService } from "./service.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { getDataScopeWhere } from "../context/index.js";

export interface BaseControllerConfig {
  routePrefix: string;
  tags: string[];
  permissionPrefix: string;
  enableAudit?: boolean;
  defaultPageSize?: number;
  maxPageSize?: number;
  filterableFields?: string[];
  keywordFields?: string[];
  hiddenFields?: string[];
}

export interface IControllerHooks<T, CreateDto, UpdateDto, QueryDto> {
  beforeList(query: QueryDto, req: Request): Promise<QueryDto>;
  afterList(data: T[], req: Request): Promise<T[]>;
  beforeCreate(dto: CreateDto, req: Request): Promise<CreateDto>;
  afterCreate(data: T, req: Request): Promise<T>;
  beforeUpdate(id: string, dto: UpdateDto, req: Request): Promise<UpdateDto>;
  afterUpdate(data: T, req: Request): Promise<T>;
  beforeDelete(id: string, req: Request): Promise<boolean>;
  afterDelete(id: string, req: Request): Promise<void>;
  beforeDetail(id: string, req: Request): Promise<void>;
  afterDetail(data: T, req: Request): Promise<T>;
}

export abstract class BaseController<
  T,
  CreateDto extends Record<string, unknown>,
  UpdateDto extends Record<string, unknown>,
  QueryDto extends BaseQuery,
> implements IControllerHooks<T, CreateDto, UpdateDto, QueryDto> {
  protected abstract readonly repository: BaseRepository<T, any, any, any>;
  protected readonly service?: BaseService<any>;
  protected abstract readonly config: BaseControllerConfig;
  protected abstract readonly createSchema?: ZodTypeAny;
  protected abstract readonly updateSchema?: ZodTypeAny;

  protected readonly querySchema: ZodTypeAny = z
    .object({
      pageNum: z.number().default(1),
      pageSize: z.number().default(10),
      keyword: z.string().optional(),
      status: z.string().optional(),
    })
    .strict();

  protected readonly idParamSchema = z.object({ id: z.string().uuid() });

  // ========== 钩子 ==========
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

  // ========== CRUD ==========

  /** fail-closed：从 ALS 读，缺上下文直接抛 */
  protected applyDataScope(): void {
    const where = getDataScopeWhere();
    this.repository.setDataScope(where);
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);

      let query = this.parseQueryParams(req.query) as QueryDto;
      query.tenantId = tenantId;
      query = await this.beforeList(query, req);

      this.applyDataScope();

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

  async detail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);

      this.applyDataScope();
      await this.beforeDetail(id, req);

      const data = await this.repository.findById(id, tenantId);
      if (!data) throw new AppError("记录不存在", 404001, 404);

      success(res, await this.afterDetail(data, req));
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId || req.user?.tenantId;
      if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);
      const userId = req.user?.userId;

      let dto = this.parseCreateDto(req.body);
      dto = await this.beforeCreate(dto, req);

      const dbData = keysToSnakeCase(dto);
      const result = await this.repository.create(dbData, tenantId, userId);
      const created = await this.afterCreate(result, req);
      success(res, created, "创建成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);

      this.applyDataScope();
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

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);

      this.applyDataScope();
      const canDelete = await this.beforeDelete(id, req);
      if (!canDelete) throw new AppError("不满足删除条件", 400001, 400);

      await this.repository.softDelete(id, tenantId, req.user?.userId);
      await this.afterDelete(id, req);
      success(res, null, "删除成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async batchRemove(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      const tenantId = req.tenantId;
      if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);
      if (!Array.isArray(ids) || ids.length === 0)
        throw new AppError("请选择要删除的记录", 400001, 400);

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

  // ========== 工具 ==========

  protected parseQueryParams(query: any): QueryDto {
    const parsed: any = this.querySchema.safeParse({
      ...query,
      pageNum: Number(query.pageNum) || 1,
      pageSize: Number(query.pageSize) || this.config.defaultPageSize || 10,
    });
    if (!parsed.success) {
      throw new AppError("查询参数无效", 400001, 400, parsed.error.flatten());
    }
    const { pageNum, pageSize, ...rest } = parsed.data;
    const maxSize = this.config.maxPageSize ?? 100;
    return {
      ...rest,
      pageNum: Math.max(1, pageNum),
      pageSize: Math.min(maxSize, Math.max(1, pageSize)),
    } as QueryDto;
  }

  protected parseCreateDto(body: any): CreateDto {
    if (!this.createSchema)
      throw new AppError("createSchema 未定义", 500001, 500);
    const parsed: any = this.createSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("参数校验失败", 400001, 400, parsed.error.flatten());
    }
    return parsed.data as CreateDto;
  }

  protected parseUpdateDto(body: any): UpdateDto {
    if (!this.updateSchema)
      throw new AppError("updateSchema 未定义", 500001, 500);
    const parsed: any = this.updateSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("参数校验失败", 400001, 400, parsed.error.flatten());
    }
    return parsed.data as UpdateDto;
  }

  protected buildListWhere(query: QueryDto): any {
    const where: any = {};
    const allow = this.config.filterableFields ?? ["status", "fields"];
    for (const key of allow) {
      if (query[key] !== undefined && query[key] !== "") {
        where[key] = query[key];
      }
    }
    if (query.keyword && this.config.keywordFields?.length) {
      where.OR = this.config.keywordFields.map((f) => ({
        [f]: { contains: query.keyword },
      }));
    }
    return keysToSnakeCase(where);
  }

  protected transformOne(data: T): T {
    const camel = keysToCamelCase<any>(data);
    for (const key in camel) {
      if (camel[key] instanceof Date) {
        camel[key] = dayjs(camel[key]).format("YYYY-MM-DD HH:mm:ss");
      }
      if (this.config.hiddenFields?.includes(key)) delete camel[key];
    }
    return camel as T;
  }

  protected transformList(data: T[]): T[] {
    return data.map((item) => this.transformOne(item));
  }

  protected handleError(res: Response, err: unknown): void {
    if (res.headersSent) return;
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
