import { Prisma } from "@prisma/client/extension";

/**
 * 软删除标志常量
 */
export const SOFT_DELETE_FLAG = {
  NORMAL: 0,
  DELETED: 1,
} as const;

/**
 * 排序方向
 */
export type SortDirection = "asc" | "desc";

/**
 * 分页查询参数
 */
export interface PageQuery {
  pageNum: number;
  pageSize: number;
}

/**
 * 排序参数
 */
export interface SortQuery {
  field: string;
  direction: SortDirection;
}

/**
 * 通用查询条件
 */
export interface BaseQuery {
  tenantId: string;
  pageNum?: number;
  pageSize?: number;
  keyword?: string;
  status?: number;
  sort?: Array<{ field: string; direction: "asc" | "desc" }>;
  fields?: string | string[];
  [key: string]: unknown;
}

/**
 * 分页结果
 */
export interface PageResult<T> {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 基础实体字段（对应数据库通用字段）
 */
export interface BaseEntity {
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  updated_by: string | null;
  is_deleted: number;
}

/**
 * 基础仓库接口
 */
export interface IBaseRepository<T, CreateInput, UpdateInput, WhereInput> {
  findById(id: string, tenantId: string): Promise<T | null>;
  findOne(where: WhereInput, tenantId: string): Promise<T | null>;
  findMany(where: WhereInput, options?: QueryOptions): Promise<T[]>;
  findPage(query: BaseQuery, where: WhereInput): Promise<PageResult<T>>;
  create(data: CreateInput, tenantId: string, userId?: string): Promise<T>;
  update(
    id: string,
    data: UpdateInput,
    tenantId: string,
    userId?: string,
  ): Promise<T>;
  softDelete(id: string, tenantId: string, userId?: string): Promise<T>;
  hardDelete(id: string, tenantId: string): Promise<T>;
  exists(where: WhereInput, tenantId: string): Promise<boolean>;
  count(where: WhereInput, tenantId: string): Promise<number>;
  transaction<R>(
    callback: (tx: Prisma.TransactionClient) => Promise<R>,
  ): Promise<R>;
}

/**
 * 查询选项
 */
export interface QueryOptions {
  skip?: number;
  take?: number;
  orderBy?: Record<string, SortDirection>;
  include?: Record<string, boolean>;
}

export interface PageBuildContext {
  /** 已合并的 where（业务条件 + 租户 + 软删除 + 数据权限） */
  finalWhere: Record<string, any>;
  /** 原始 query（含 pageNum / pageSize / keyword / 各业务字段） */
  query: BaseQuery & Record<string, any>;
}

export interface PageOptions {
  /** 默认排序，不传则按 createdAtField desc */
  defaultOrderBy?: Record<string, "asc" | "desc">;
  /** 覆盖默认 include */
  include?: Record<string, any>;
  /** 子类自定义 where 增强（keyword、时间范围等） */
  extendWhere?: (ctx: PageBuildContext) => Record<string, any>;
  /** 子类自定义 select */
  select?: Record<string, boolean>;
}
