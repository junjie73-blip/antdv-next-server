import { prisma } from "@/config/database.js";
import {
  IBaseRepository,
  BaseQuery,
  PageResult,
  QueryOptions,
  SOFT_DELETE_FLAG,
  PageOptions,
} from "@/types/base-repository.js";
import { AppError } from "@/core/errors.js";
import { redis, scanAll } from "@/config/redis.js";
import { createHash } from "node:crypto";
import { isString } from "es-toolkit";
import { keysToSnakeCase } from "@/common/utils/case-convert.js";

export abstract class BaseRepository<
  T,
  CreateInput,
  UpdateInput,
  WhereInput,
> implements IBaseRepository<T, CreateInput, UpdateInput, WhereInput> {
  protected abstract readonly model: any;

  protected readonly tenantField: string = "tenant_id";
  protected readonly primaryKey: string = "id";
  protected readonly softDeleteField: string = "is_deleted";
  protected readonly createdAtField: string = "created_at";
  protected readonly updatedAtField: string = "updated_at";
  protected readonly createdByField: string = "created_by";
  protected readonly updatedByField: string = "updated_by";

  // ============================================================
  // 数据权限
  // ============================================================

  protected dataScopeWhere: Record<string, any> = {};

  setDataScope(where: Record<string, any> | undefined | null): void {
    this.dataScopeWhere = where ?? {};
  }

  clearDataScope(): void {
    this.dataScopeWhere = {};
  }

  /** 子类可覆盖：平台级表返回 false */
  protected useTenantFilter(): boolean {
    return true;
  }

  /** 子类可覆盖：需要跨租户（如审计日志聚合）返回 true */
  protected isSoftDeleteTable(): boolean {
    return true;
  }

  protected mergeDataScope<W extends Record<string, any>>(where: W): W {
    if (!this.dataScopeWhere || Object.keys(this.dataScopeWhere).length === 0) {
      return where;
    }
    return { ...where, ...this.dataScopeWhere };
  }

  // ============================================================
  // Total 缓存
  // ============================================================

  protected readonly totalCacheTTL: number = 30;
  protected readonly enableTotalCache: boolean = true;

  private buildTotalCacheKey(where: any): string {
    const hash = createHash("sha1")
      .update(JSON.stringify(where))
      .digest("hex")
      .slice(0, 16);
    return `cache:total:${this.constructor.name}:${hash}`;
  }

  /** 统计（带缓存） */
  protected async countWithCache(where: any): Promise<number> {
    if (!this.enableTotalCache) {
      return this.model.count({ where });
    }
    const key = this.buildTotalCacheKey(where);
    try {
      const cached = await redis.get(key);
      if (cached !== null) return Number(cached);
    } catch {}

    const total = await this.model.count({ where });

    try {
      await redis.setex(key, this.totalCacheTTL, String(total));
    } catch {}
    return total;
  }

  /**
   * 失效 total 缓存
   * ⭐ 用 scanAll 替代 redis.keys（非阻塞）
   */
  protected async invalidateTotalCache(): Promise<void> {
    if (!this.enableTotalCache) return;
    try {
      const pattern = `cache:total:${this.constructor.name}:*`;
      const keys = await scanAll(pattern);
      if (keys.length) await redis.del(...keys);
    } catch {
      // 缓存失效失败不影响业务
    }
  }

  // ============================================================
  // 查询
  // ============================================================

  /**
   * 统一分页方法
   * ⭐ maxPageSize 从 options 拿，不从 query 拿
   */
  protected async paginate(
    query: BaseQuery & Record<string, any>,
    where: Record<string, any> = {},
    options: PageOptions = {},
  ): Promise<PageResult<T>> {
    const pageNum = Math.max(1, query.pageNum || 1);
    const maxPageSize = query.maxPageSize ?? 100; // ⭐ 从 options
    const pageSize = Math.min(maxPageSize, Math.max(1, query.pageSize || 10));
    const skip = (pageNum - 1) * pageSize;

    // 1) 基础 where
    const base: Record<string, any> = { ...where };
    if (this.isSoftDeleteTable()) {
      base[this.softDeleteField] = SOFT_DELETE_FLAG.NORMAL;
    }
    if (this.useTenantFilter()) {
      base[this.tenantField] = query.tenantId;
    }
    // 2) 子类扩展
    let finalWhere = base;
    if (options.extendWhere) {
      finalWhere = {
        ...finalWhere,
        ...options.extendWhere({ finalWhere, query }),
      };
    }

    // 3) 数据权限
    finalWhere = this.mergeDataScope(finalWhere);

    // 4) 排序
    const orderBy = options.defaultOrderBy ?? this.defaultOrderBy;

    const findArgs: any = {
      where: finalWhere,
      skip,
      take: pageSize,
      orderBy,
    };
    if (query.fields) {
      const fields = isString(query.fields)
        ? query.fields.split(",")
        : query.fields.filter(Boolean);
      const input = fields.map((item) => ({
        [item]: true,
      }));
      findArgs.select = normalizeSelect(input);
    }

    if (options.include) findArgs.include = options.include;
    if (options.select) findArgs.select = options.select;
    const [list, total] = await Promise.all([
      this.model.findMany(findArgs),
      this.countWithCache(finalWhere),
    ]);

    return {
      list,
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string, tenantId: string): Promise<T | null> {
    const base = this.buildWhereWithTenant(
      { [this.primaryKey]: id } as WhereInput,
      tenantId,
    );
    return this.model.findFirst({ where: this.mergeDataScope(base) });
  }

  async findOne(where: WhereInput, tenantId: string): Promise<T | null> {
    const base = this.buildWhereWithTenant(where, tenantId);
    return this.model.findFirst({ where: this.mergeDataScope(base) });
  }

  async findMany(where: WhereInput, options: QueryOptions = {}): Promise<T[]> {
    const { skip, take, orderBy, include } = options;
    const base: any = { ...where };
    if (this.isSoftDeleteTable()) {
      base[this.softDeleteField] = SOFT_DELETE_FLAG.NORMAL;
    }
    return this.model.findMany({
      where: this.mergeDataScope(base),
      skip,
      take,
      orderBy,
      include,
    });
  }

  async findPage(query: BaseQuery, where: WhereInput): Promise<PageResult<T>> {
    // 默认走 paginate，子类可覆盖
    return this.paginate({ ...query, maxPageSize: 100 }, where as any, {
      defaultOrderBy: this.defaultOrderBy,
    });
  }

  // ============================================================
  // 写
  // ============================================================

  async create(
    data: CreateInput,
    tenantId: string,
    userId?: string,
  ): Promise<T> {
    const createData = {
      ...data,
      [this.tenantField]: tenantId,
      [this.createdByField]: userId || null,
      [this.updatedByField]: userId || null,
      [this.createdAtField]: new Date(),
      [this.updatedAtField]: new Date(),
      [this.softDeleteField]: SOFT_DELETE_FLAG.NORMAL,
    };
    const record = await this.model.create({ data: createData });
    await this.invalidateTotalCache(); // ⭐ await
    return record;
  }

  async update(
    id: string,
    data: UpdateInput,
    tenantId: string,
    userId?: string,
  ): Promise<T> {
    const exists = await this.model.findFirst({
      where: {
        [this.primaryKey]: id,
        [this.tenantField]: tenantId,
        [this.softDeleteField]: SOFT_DELETE_FLAG.NORMAL,
      },
    });
    if (!exists) throw new AppError("记录不存在", 404001, 404);

    const record = await this.model.update({
      where: { [this.primaryKey]: id },
      data: {
        ...data,
        [this.updatedByField]: userId || null,
        [this.updatedAtField]: new Date(),
      },
    });
    await this.invalidateTotalCache(); // ⭐ await
    return record;
  }

  async softDelete(id: string, tenantId: string, userId?: string): Promise<T> {
    const exists = await this.findById(id, tenantId);
    if (!exists) throw new AppError("记录不存在", 404001, 404);

    const record = await this.model.update({
      where: { [this.primaryKey]: id },
      data: {
        [this.softDeleteField]: SOFT_DELETE_FLAG.DELETED,
        [this.updatedByField]: userId || null,
        [this.updatedAtField]: new Date(),
      },
    });
    await this.invalidateTotalCache(); // ⭐ await
    return record;
  }

  async hardDelete(id: string, tenantId: string): Promise<T> {
    const exists = await this.findById(id, tenantId);
    if (!exists) throw new AppError("记录不存在", 404001, 404);

    const record = await this.model.delete({
      where: { [this.primaryKey]: id },
    });
    await this.invalidateTotalCache(); // ⭐ await
    return record;
  }

  async exists(where: WhereInput, tenantId: string): Promise<boolean> {
    const base = this.buildWhereWithTenant(where, tenantId);
    const count = await this.model.count({
      where: this.mergeDataScope(base),
    });
    return count > 0;
  }

  async count(where: WhereInput, tenantId: string): Promise<number> {
    const base = this.buildWhereWithTenant(where, tenantId);
    return this.model.count({
      where: this.mergeDataScope(base),
    });
  }

  // ============================================================
  // 事务 / 批量
  // ============================================================

  async transaction<R>(callback: (tx: any) => Promise<R>): Promise<R> {
    return prisma.$transaction(async (tx) => callback(tx));
  }

  async createMany(
    data: CreateInput[],
    tenantId: string,
    userId?: string,
  ): Promise<{ count: number }> {
    const createData = data.map((item) => ({
      ...item,
      [this.tenantField]: tenantId,
      [this.createdByField]: userId || null,
      [this.updatedByField]: userId || null,
      [this.createdAtField]: new Date(),
      [this.updatedAtField]: new Date(),
      [this.softDeleteField]: SOFT_DELETE_FLAG.NORMAL,
    }));
    const result = await this.model.createMany({
      data: createData,
      skipDuplicates: true,
    });
    await this.invalidateTotalCache(); // ⭐ await
    return result;
  }

  async softDeleteMany(
    ids: string[],
    tenantId: string,
    userId?: string,
  ): Promise<{ count: number }> {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError("ids 参数必须是非空数组", 400001, 400);
    }

    const where: any = {
      [this.primaryKey]: { in: ids },
      [this.softDeleteField]: SOFT_DELETE_FLAG.NORMAL,
    };
    if (this.useTenantFilter()) {
      where[this.tenantField] = tenantId;
    }

    const result = await this.model.updateMany({
      where,
      data: {
        [this.softDeleteField]: SOFT_DELETE_FLAG.DELETED,
        [this.updatedByField]: userId || null,
        [this.updatedAtField]: new Date(),
      },
    });
    await this.invalidateTotalCache(); // ⭐ await
    return { count: result.count };
  }

  // ============================================================
  // 内部工具
  // ============================================================

  protected buildWhereWithTenant(where: WhereInput, tenantId: string): any {
    const result: any = { ...where };
    if (this.useTenantFilter()) {
      result[this.tenantField] = tenantId;
    }
    if (this.isSoftDeleteTable()) {
      result[this.softDeleteField] = SOFT_DELETE_FLAG.NORMAL;
    }
    return result;
  }

  protected get defaultOrderBy(): any {
    return { [this.createdAtField]: "desc" };
  }

  protected buildOrderBy(
    sort?: Array<{ field: string; direction: "asc" | "desc" }>,
  ): any {
    if (!sort || sort.length === 0) return this.defaultOrderBy;
    return sort.map((s) => ({ [s.field]: s.direction }));
  }
}
function normalizeSelect(input: unknown): Record<string, boolean> | undefined {
  if (!input) return undefined;

  let obj: Record<string, any>;
  if (Array.isArray(input)) {
    obj = Object.assign({}, ...input);
  } else if (typeof input === "object") {
    obj = { ...(input as Record<string, any>) };
  } else {
    return undefined;
  }

  // 只保留值为 true 的字段，避免 {a: false} 触发 Prisma 报错
  const cleaned: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === true) cleaned[k] = true;
  }
  if (Object.keys(cleaned).length === 0) return undefined;

  return keysToSnakeCase(cleaned) as Record<string, boolean>;
}
