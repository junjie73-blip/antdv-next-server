import { Request, Response } from "express";
import { z, ZodTypeAny } from "zod";
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
import { AppError } from "@/middleware/error-handler.js";
import { Req, Res } from "./decorator/index.js";
import dayjs from "dayjs";

/**
 * 通用基础控制器类
 * 封装标准 CRUD 操作，支持通过钩子方法扩展
 *
 * @template T - 实体类型
 * @template CreateDto - 创建 DTO 类型
 * @template UpdateDto - 更新 DTO 类型
 * @template QueryDto - 查询 DTO 类型
 */
export abstract class BaseController<
  T,
  CreateDto extends Record<string, unknown>,
  UpdateDto extends Record<string, unknown>,
  QueryDto extends BaseQuery,
> implements IControllerHooks<T, CreateDto, UpdateDto, QueryDto> {
  /** 基础仓库实例 */
  protected abstract readonly repository: BaseRepository<T, any, any, any>;

  /** 控制器配置 */
  protected abstract readonly config: BaseControllerConfig;

  /** 创建验证 Schema */
  protected abstract readonly createSchema?: ZodTypeAny;

  /** 更新验证 Schema */
  protected abstract readonly updateSchema?: ZodTypeAny;

  /** 查询验证 Schema */
  protected readonly querySchema: ZodTypeAny = z.object({
    pageNum: z.number().default(1),
    pageSize: z.number().default(10),
    keyword: z.string().optional(),
    status: z.string().optional(),
  });

  /** ID 参数验证 */
  protected readonly idParamSchema = z.object({
    id: z.string().uuid(),
  });

  // ==================== 钩子方法（子类可重写）====================

  async beforeList(query: QueryDto, _req: Request): Promise<QueryDto> {
    return query;
  }

  async afterList(data: T[], _req: Request): Promise<T[]> {
    return data
      .map((item: any) => keysToCamelCase(item))
      .map((item: any) => {
        // 判断当前字段是不是时间格式，如果是就转成 YYYY-MM-DD HH:mm:ss 格式
        for (const key in item) {
          if (item[key] instanceof Date) {
            item[key] = dayjs(item[key]).format("YYYY-MM-DD HH:mm:ss");
          }
          if (this.config.hiddenFields?.includes(key)) {
            delete item[key];
          }
        }
        return item as T;
      });
  }

  async beforeCreate(dto: CreateDto, _req: Request): Promise<CreateDto> {
    return dto;
  }

  async afterCreate(_data: T, _req: Request): Promise<T> {
    const data = keysToCamelCase<T>(_data);
    for (const key in data) {
      if (data[key] instanceof Date) {
        // @ts-ignore
        data[key] = dayjs(data[key]).format("YYYY-MM-DD HH:mm:ss");
      }
      if (this.config.hiddenFields?.includes(key)) {
        delete data[key];
      }
    }
    // 默认空实现
    return data;
  }

  async beforeUpdate(
    id: string,
    dto: UpdateDto,
    _req: Request,
  ): Promise<UpdateDto> {
    return dto;
  }

  async afterUpdate(_data: T, _req: Request): Promise<T> {
    const data = keysToCamelCase<T>(_data);
    for (const key in data) {
      if (data[key] instanceof Date) {
        // @ts-ignore
        data[key] = dayjs(data[key]).format("YYYY-MM-DD HH:mm:ss");
      }
    }
    return data;
  }

  async beforeDelete(_id: string, _req: Request): Promise<boolean> {
    return true;
  }

  async afterDelete(_id: string, _req: Request): Promise<void> {
    // 默认空实现
  }

  async beforeDetail(_id: string, _req: Request): Promise<void> {
    // 默认空实现
  }

  async afterDetail(data: T, _req: Request): Promise<T> {
    const _data = keysToCamelCase<T>(data);
    for (const key in _data) {
      if (_data[key] instanceof Date) {
        // @ts-ignore
        _data[key] = dayjs(_data[key]).format("YYYY-MM-DD HH:mm:ss");
      }
      if (this.config.hiddenFields?.includes(key)) {
        delete _data[key];
      }
    }
    return _data;
  }

  // ==================== 通用 CRUD 方法 ====================

  /**
   * 分页列表查询
   */
  async list(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const tenantId = req?.tenantId;

      // 解析并验证查询参数
      let query = this.parseQueryParams(req.query) as QueryDto;
      query.tenantId = tenantId!;
      console.log(query, "query");
      // 执行查询前钩子
      query = await this.beforeList(query, req);

      // 构建查询条件
      const where = this.buildListWhere(query);

      // 执行分页查询
      const result = await this.repository.findPage(query, where);

      // 执行查询后钩子
      result.list = await this.afterList(result.list, req);
      // 返回结果（自动转换命名风格）
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

  /**
   * 查询详情
   */
  async detail(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;

      await this.beforeDetail(id, req);

      const data = await this.repository.findById(id, tenantId);
      if (!data) {
        throw new AppError(404, "记录不存在", 404);
      }

      const transformedData = await this.afterDetail(data, req);
      success(res, transformedData);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /**
   * 创建记录
   */
  async create(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const tenantId =
        req.tenantId! || req.body.tenantId! || req.user?.tenantId!;
      const userId = req.user?.userId;

      // 转换请求数据
      let dto = this.parseCreateDto(req.body);

      // 执行创建前钩子
      dto = await this.beforeCreate(dto, req);

      // 转换为数据库命名风格
      const dbData = keysToSnakeCase({ ...dto, tenantId });

      // 执行创建
      const result = await this.repository.create(dbData, tenantId, userId);

      // 执行创建后钩子
      await this.afterCreate(result, req);

      success(res, null, "创建成功", 200);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /**
   * 更新记录
   */
  async update(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;
      const userId = req.user?.userId;

      // 转换请求数据
      let dto = this.parseUpdateDto(req.body);

      // 执行更新前钩子
      dto = await this.beforeUpdate(id, dto, req);

      // 转换为数据库命名风格
      const dbData = keysToSnakeCase(dto);

      // 执行更新
      const result = await this.repository.update(id, dbData, tenantId, userId);
      // 执行更新后钩子
      await this.afterUpdate(result, req);

      success(res, null, "更新成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /**
   * 删除记录（软删除）
   */
  async remove(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;
      const userId = req.user?.userId;

      // 执行删除前钩子
      const canDelete = await this.beforeDelete(id, req);
      if (!canDelete) {
        throw new AppError(400, "不满足删除条件", 400);
      }

      // 执行软删除
      await this.repository.softDelete(id, tenantId, userId);

      // 执行删除后钩子
      await this.afterDelete(id, req);

      success(res, null, "删除成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /**
   * 批量删除
   */
  async batchRemove(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      const tenantId = req.tenantId!;
      const userId = req.user?.userId;

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new AppError(400, "请选择要删除的记录", 400);
      }

      const result = await this.repository.softDeleteMany(
        ids,
        tenantId,
        userId,
      );
      success(res, { deletedCount: result.count }, "批量删除成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  // ==================== 受保护的工具方法 ====================

  /**
   * 解析查询参数
   */
  protected parseQueryParams(query: any): QueryDto {
    return {
      ...query,
      pageNum: query.pageNum ? Number(query.pageNum) : 1,
      pageSize: query.pageSize
        ? Number(query.pageSize)
        : this.config.defaultPageSize,
    } as QueryDto;
  }

  /**
   * 解析创建 DTO
   */
  protected parseCreateDto(body: any): CreateDto {
    return body as CreateDto;
  }

  /**
   * 解析更新 DTO
   */
  protected parseUpdateDto(body: any): UpdateDto {
    return body as UpdateDto;
  }

  /**
   * 构建列表查询条件（子类可重写）
   */
  protected buildListWhere(query: QueryDto): any {
    const where: any = {};

    if (query.keyword) {
      // 子类应重写此方法实现关键字搜索
    }

    if (query.status !== undefined) {
      where.status = query.status;
    }

    return where;
  }

  /**
   * 统一错误处理
   */
  protected handleError(@Res() res: Response, err: unknown): void {
    if (err instanceof AppError) {
      error(res, err.message, err.code, err.statusCode);
      return;
    }
    console.error("Controller error:", err);
    error(res, "操作失败", 500, 500);
  }

  /**
   * 获取权限编码
   */
  protected getPermission(action: string): string {
    return `${this.config.permissionPrefix}:${action}`;
  }
}
