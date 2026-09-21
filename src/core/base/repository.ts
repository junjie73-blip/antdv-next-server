import { prisma } from "@/config/database.js";
import { redis } from "@/config/redis.js";
import { createHash } from "node:crypto";
import { isString } from "es-toolkit";
import { keysToSnakeCase } from "@/shared/utils/case-convert.js";
import { AppError } from "@/core/errors.js";
import { SCAN_MAX_KEYS } from "@/config/constants.js";
import { scanAll } from "../cache/redis-client.js";

export const SOFT_DELETE_FLAG = { NORMAL: 0, DELETED: 1 } as const;

export interface BaseQuery {
  pageNum?: number;
  pageSize?: number;
  tenantId?: string;
  fields?: string | string[];
  maxPageSize?: number;
  [key: string]: unknown;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
  totalPages: number;
}

export interface QueryOptions {
  skip?: number;
  take?: number;
  orderBy?: any;
  include?: any;
}

export interface PageOptions {
  defaultOrderBy?: any;
  include?: any;
  select?: any;
  extendWhere?: (ctx: {
    finalWhere: Record<string, any>;
    query: BaseQuery;
  }) => Record<string, any>;
}

export type TxClient = any;

export abstract class BaseRepository<T, CreateInput, UpdateInput, WhereInput> {
  protected abstract readonly model: any;

  protected readonly tenantField = "tenant_id";
  protected readonly primaryKey: string = "id";
  protected readonly softDeleteField = "is_deleted";
  protected readonly createdAtField = "created_at";
  protected readonly updatedAtField = "updated_at";
  protected readonly createdByField = "created_by";
  protected readonly updatedByField = "updated_by";

  protected dataScopeWhere: Record<string, any> = {};

  setDataScope(where: Record<string, any> | undefined | null): void {
    this.dataScopeWhere = where ?? {};
  }
  clearDataScope(): void {
    this.dataScopeWhere = {};
  }
  protected useTenantFilter(): boolean {
    return true;
  }
  protected isSoftDeleteTable(): boolean {
    return true;
  }
  protected mergeDataScope<W extends Record<string, any>>(where: W): W {
    if (!this.dataScopeWhere || Object.keys(this.dataScopeWhere).length === 0)
      return where;
    return { ...where, ...this.dataScopeWhere };
  }

  // ============ Total Cache（版本号方案）============

  protected readonly totalCacheTTL = 30;
  protected readonly enableTotalCache = true;

  protected versionKey(): string {
    return `cache:ver:${this.constructor.name}`;
  }

  protected async getVersion(): Promise<string> {
    try {
      return (await redis.get(this.versionKey())) ?? "0";
    } catch {
      return "0";
    }
  }

  protected buildTotalCacheKey(version: string, where: any): string {
    const hash = createHash("sha1")
      .update(JSON.stringify(where))
      .digest("hex")
      .slice(0, 16);
    return `cache:total:${this.constructor.name}:v${version}:${hash}`;
  }

  protected async countWithCache(where: any): Promise<number> {
    if (!this.enableTotalCache) return this.model.count({ where });

    const version = await this.getVersion();
    const key = this.buildTotalCacheKey(version, where);

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

  /** O(1) 失效：递增版本号 */
  protected async invalidateTotalCache(): Promise<void> {
    if (!this.enableTotalCache) return;
    try {
      await redis.incr(this.versionKey());
    } catch {}
  }

  // ============ 查询 ============

  protected async paginate(
    query: BaseQuery & Record<string, any>,
    where: Record<string, any> = {},
    options: PageOptions = {},
  ): Promise<PageResult<T>> {
    const pageNum = Math.max(1, query.pageNum || 1);
    const maxPageSize = query.maxPageSize ?? 100;
    const pageSize = Math.min(maxPageSize, Math.max(1, query.pageSize || 10));
    const skip = (pageNum - 1) * pageSize;

    const base: Record<string, any> = { ...where };
    if (this.isSoftDeleteTable())
      base[this.softDeleteField] = SOFT_DELETE_FLAG.NORMAL;
    if (this.useTenantFilter()) base[this.tenantField] = query.tenantId;

    let finalWhere = base;
    if (options.extendWhere) {
      finalWhere = {
        ...finalWhere,
        ...options.extendWhere({ finalWhere, query }),
      };
    }
    finalWhere = this.mergeDataScope(finalWhere);

    const orderBy = options.defaultOrderBy ?? this.defaultOrderBy;
    const findArgs: any = { where: finalWhere, skip, take: pageSize, orderBy };

    if (query.fields) {
      const fields = isString(query.fields)
        ? query.fields.split(",")
        : query.fields.filter(Boolean);
      findArgs.select = normalizeSelect(fields.map((f) => ({ [f]: true })));
      delete findArgs.where.fields;
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

  async findById(
    id: string,
    tenantId: string,
    tx?: TxClient,
  ): Promise<T | null> {
    const base = this.buildWhereWithTenant(
      { [this.primaryKey]: id } as WhereInput,
      tenantId,
    );
    return (tx ?? this.model).findFirst({ where: this.mergeDataScope(base) });
  }

  async findOne(
    where: WhereInput,
    tenantId: string,
    tx?: TxClient,
  ): Promise<T | null> {
    const base = this.buildWhereWithTenant(where, tenantId);
    return (tx ?? this.model).findFirst({ where: this.mergeDataScope(base) });
  }

  async findMany(
    where: WhereInput,
    options: QueryOptions = {},
    tx?: TxClient,
  ): Promise<T[]> {
    const { skip, take, orderBy, include } = options;
    const base: any = { ...where };
    if (this.isSoftDeleteTable())
      base[this.softDeleteField] = SOFT_DELETE_FLAG.NORMAL;
    return (tx ?? this.model).findMany({
      where: this.mergeDataScope(base),
      skip,
      take,
      orderBy,
      include,
    });
  }

  async findPage(query: BaseQuery, where: WhereInput): Promise<PageResult<T>> {
    return this.paginate({ ...query, maxPageSize: 100 }, where as any, {
      defaultOrderBy: this.defaultOrderBy,
    });
  }

  // ============ 写 ============

  async create(
    data: CreateInput,
    tenantId: string,
    userId?: string,
    tx?: TxClient,
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
    const record = await (tx ?? this.model).create({ data: createData });
    await this.invalidateTotalCache();
    return record;
  }

  async update(
    id: string,
    data: UpdateInput,
    tenantId: string,
    userId?: string,
    tx?: TxClient,
  ): Promise<T> {
    const client = tx ?? this.model;
    const exists = await client.findFirst({
      where: {
        [this.primaryKey]: id,
        [this.tenantField]: tenantId,
        [this.softDeleteField]: SOFT_DELETE_FLAG.NORMAL,
      },
    });
    if (!exists) throw new AppError("记录不存在", 404001, 404);

    const record = await client.update({
      where: { [this.primaryKey]: id },
      data: {
        ...data,
        [this.updatedByField]: userId || null,
        [this.updatedAtField]: new Date(),
      },
    });
    await this.invalidateTotalCache();
    return record;
  }

  async softDelete(
    id: string,
    tenantId: string,
    userId?: string,
    tx?: TxClient,
  ): Promise<T> {
    const client = tx ?? this.model;
    const exists = await this.findById(id, tenantId, tx);
    if (!exists) throw new AppError("记录不存在", 404001, 404);

    const record = await client.update({
      where: { [this.primaryKey]: id },
      data: {
        [this.softDeleteField]: SOFT_DELETE_FLAG.DELETED,
        [this.updatedByField]: userId || null,
        [this.updatedAtField]: new Date(),
      },
    });
    await this.invalidateTotalCache();
    return record;
  }

  async hardDelete(id: string, tenantId: string, tx?: TxClient): Promise<T> {
    const client = tx ?? this.model;
    const exists = await this.findById(id, tenantId, tx);
    if (!exists) throw new AppError("记录不存在", 404001, 404);

    const record = await client.delete({ where: { [this.primaryKey]: id } });
    await this.invalidateTotalCache();
    return record;
  }

  async exists(
    where: WhereInput,
    tenantId: string,
    tx?: TxClient,
  ): Promise<boolean> {
    const base = this.buildWhereWithTenant(where, tenantId);
    const count = await (tx ?? this.model).count({
      where: this.mergeDataScope(base),
    });
    return count > 0;
  }

  async count(
    where: WhereInput,
    tenantId: string,
    tx?: TxClient,
  ): Promise<number> {
    const base = this.buildWhereWithTenant(where, tenantId);
    return (tx ?? this.model).count({ where: this.mergeDataScope(base) });
  }

  // ============ 事务 / 批量 ============

  async transaction<R>(callback: (tx: TxClient) => Promise<R>): Promise<R> {
    return prisma.$transaction(async (tx) => callback(tx));
  }

  async createMany(
    data: CreateInput[],
    tenantId: string,
    userId?: string,
    tx?: TxClient,
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
    const result = await (tx ?? this.model).createMany({
      data: createData,
      skipDuplicates: true,
    });
    await this.invalidateTotalCache();
    return result;
  }

  async softDeleteMany(
    ids: string[],
    tenantId: string,
    userId?: string,
    tx?: TxClient,
  ): Promise<{ count: number }> {
    if (!Array.isArray(ids) || ids.length === 0)
      throw new AppError("ids 参数必须是非空数组", 400001, 400);

    const where: any = {
      [this.primaryKey]: { in: ids },
      [this.softDeleteField]: SOFT_DELETE_FLAG.NORMAL,
    };
    if (this.useTenantFilter()) where[this.tenantField] = tenantId;

    const result = await (tx ?? this.model).updateMany({
      where,
      data: {
        [this.softDeleteField]: SOFT_DELETE_FLAG.DELETED,
        [this.updatedByField]: userId || null,
        [this.updatedAtField]: new Date(),
      },
    });
    await this.invalidateTotalCache();
    return { count: result.count };
  }

  // ============ 内部 ============

  protected buildWhereWithTenant(where: WhereInput, tenantId: string): any {
    const result: any = { ...where };
    if (this.useTenantFilter()) result[this.tenantField] = tenantId;
    if (this.isSoftDeleteTable())
      result[this.softDeleteField] = SOFT_DELETE_FLAG.NORMAL;
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

export function normalizeSelect(
  input: unknown,
): Record<string, boolean> | undefined {
  if (!input) return undefined;
  let obj: Record<string, any>;
  if (Array.isArray(input)) obj = Object.assign({}, ...input);
  else if (typeof input === "object")
    obj = { ...(input as Record<string, any>) };
  else return undefined;

  const cleaned: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(obj)) if (v === true) cleaned[k] = true;
  if (Object.keys(cleaned).length === 0) return undefined;
  return keysToSnakeCase(cleaned) as Record<string, boolean>;
}

// 供 scanAll 使用上限（供子类覆盖时参考）
export const REPOSITORY_SCAN_MAX_KEYS = SCAN_MAX_KEYS;
export { scanAll };
