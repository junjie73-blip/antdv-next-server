import { Request, Response } from "express";

/**
 * 控制器钩子接口
 * 允许子类在 CRUD 各阶段注入自定义逻辑
 */
export interface IControllerHooks<T, CreateDto, UpdateDto, QueryDto> {
  /** 查询前钩子：可修改查询参数 */
  beforeList?(query: QueryDto, req: Request): Promise<QueryDto> | QueryDto;
  /** 查询后钩子：可转换响应数据 */
  afterList?(data: T[], req: Request): Promise<T[]> | T[];

  /** 创建前钩子：可修改/校验创建数据 */
  beforeCreate?(dto: CreateDto, req: Request): Promise<CreateDto> | CreateDto;
  /** 创建后钩子：可转换创建数据 */
  afterCreate?(data: T, req: Request): Promise<T> | T;

  /** 更新前钩子 */
  beforeUpdate?(
    id: string,
    dto: UpdateDto,
    req: Request,
  ): Promise<UpdateDto> | UpdateDto;
  /** 更新后钩子：可转换更新数据 */
  afterUpdate?(data: T, req: Request): Promise<T> | T;

  /** 删除前钩子：可阻止删除 */
  beforeDelete?(id: string, req: Request): Promise<boolean> | boolean;
  /** 删除后钩子 */
  afterDelete?(id: string, req: Request): Promise<void> | void;

  /** 详情查询前钩子 */
  beforeDetail?(id: string, req: Request): Promise<void> | void;
  /** 详情查询后钩子 */
  afterDetail?(data: T, req: Request): Promise<T> | T;
}

/**
 * 基础控制器配置
 */
export interface BaseControllerConfig {
  /** 路由路径前缀 */
  routePrefix: string;
  /** Swagger 标签 */
  tags: string[];
  /** 需要的权限前缀 */
  permissionPrefix: string;
  /** 是否启用审计日志 */
  enableAudit: boolean;
  /** 默认分页大小 */
  defaultPageSize: number;
  /** 最大分页大小 */
  maxPageSize: number;
  /** 隐藏字段 */
  hiddenFields?: string[];
  /** 允许查询字段 */
  filterableFields?: string[];
  /** 允许模糊查询关键词字段 */
  keywordFields?: string[];
}
