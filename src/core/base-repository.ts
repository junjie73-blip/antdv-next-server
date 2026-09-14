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

/**
 * 通用基础仓库类
 * 封装所有数据访问层的通用功能
 *
 * @template T - 实体类型
 * @template CreateInput - 创建输入类型
 * @template UpdateInput - 更新输入类型
 * @template WhereInput - 查询条件类型
 */
export abstract class BaseRepository<
  T,
  CreateInput,
  UpdateInput,
  WhereInput,
> implements IBaseRepository<T, CreateInput, UpdateInput, WhereInput> {
  /** Prisma 模型代理 */
  protected abstract readonly model: any;

  /** 租户字段名 */
  protected readonly tenantField: string = "tenant_id";

  /** 主键字段名 */
  protected readonly primaryKey: string = "id";

  /** 软删除字段名 */
  protected readonly softDeleteField: string = "is_deleted";

  /** 创建时间字段名 */
  protected readonly createdAtField: string = "created_at";

  /** 更新时间字段名 */
  protected readonly updatedAtField: string = "updated_at";

  /** 创建人字段名 */
  protected readonly createdByField: string = "created_by";

  /** 更新人字段名 */
  protected readonly updatedByField: string = "updated_by";

  // ============================================================
  // 数据权限
  // ============================================================

  /** 当前生效的数据权限 where 片段（由中间件注入） */
  protected dataScopeWhere: Record<string, any> = {};

  /**
   * 设置数据权限条件
   * 由 Controller 在请求开始前调用，通常来自 req.dataScopeWhere
   */
  setDataScope(where: Record<string, any> | undefined | null): void {
    this.dataScopeWhere = where ?? {};
  }

  /** 清空数据权限 */
  clearDataScope(): void {
    this.dataScopeWhere = {};
  }
  protected useTenantFilter(): boolean {
    return true;
  }
  /**
   * 合并业务条件与数据权限条件
   * - 当 dataScopeWhere 有内容时，与传入的 where 做浅合并
   * - 数据权限条件优先级更高（会覆盖同名 key）
   */
  protected mergeDataScope<W extends Record<string, any>>(where: W): W {
    if (!this.dataScopeWhere || Object.keys(this.dataScopeWhere).length === 0) {
      return where;
    }
    return { ...where, ...this.dataScopeWhere };
  }

  // ============================================================
  // 查询方法
  // ============================================================
  /**
   * 统一分页方法
   * 子类无需重写，只通过 options 描述差异
   */
  protected async paginate(
    query: BaseQuery & Record<string, any>,
    where: Record<string, any> = {},
    options: PageOptions = {},
  ): Promise<PageResult<T>> {
    const pageNum = Math.max(1, query.pageNum || 1);
    const pageSize = Math.min(
      query.maxPageSize ?? 100,
      Math.max(1, query.pageSize || 10),
    );
    const skip = (pageNum - 1) * pageSize;

    // 1) 基础 where
    const base: Record<string, any> = {
      ...where,
      [this.softDeleteField]: SOFT_DELETE_FLAG.NORMAL,
    };
    if (this.useTenantFilter()) {
      base[this.tenantField] = query.tenantId;
    }
    let finalWhere = base;

    // 2) 子类扩展
    if (options.extendWhere) {
      finalWhere = {
        ...finalWhere,
        ...options.extendWhere({ finalWhere, query }),
      };
    }

    // 3) 数据权限
    finalWhere = this.mergeDataScope(finalWhere);

    // 4) 排序
    const orderBy = options.defaultOrderBy ?? {
      [this.createdAtField]: "desc" as const,
    };

    const findArgs: any = {
      where: finalWhere,
      skip,
      take: pageSize,
      orderBy,
    };
    if (options.include) findArgs.include = options.include;
    if (options.select) findArgs.select = options.select;

    const [list, total] = await Promise.all([
      this.model.findMany(findArgs),
      this.model.count({ where: finalWhere }),
    ]);

    return {
      list,
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
  /**
   * 根据 ID 查询（自动附加租户、软删除、数据权限）
   */
  async findById(id: string, tenantId: string): Promise<T | null> {
    const base = this.buildWhereWithTenant(
      { [this.primaryKey]: id } as WhereInput,
      tenantId,
    );
    return this.model.findFirst({
      where: this.mergeDataScope(base),
    });
  }

  /**
   * 根据条件查询单条
   */
  async findOne(where: WhereInput, tenantId: string): Promise<T | null> {
    const base = this.buildWhereWithTenant(where, tenantId);
    return this.model.findFirst({
      where: this.mergeDataScope(base),
    });
  }

  /**
   * 根据条件查询多条
   */
  async findMany(where: WhereInput, options: QueryOptions = {}): Promise<T[]> {
    const { skip, take, orderBy, include } = options;
    const base = {
      ...where,
      [this.softDeleteField]: SOFT_DELETE_FLAG.NORMAL,
    };
    return this.model.findMany({
      where: this.mergeDataScope(base),
      skip,
      take,
      orderBy,
      include,
    });
  }

  /**
   * 分页查询
   */
  async findPage(query: BaseQuery, where: WhereInput): Promise<PageResult<T>> {
    const pageNum = Math.max(1, query.pageNum || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 10));
    const skip = (pageNum - 1) * pageSize;

    let select: Record<string, boolean> | undefined;
    if (query.fields) {
      const fields = Array.isArray(query.fields)
        ? query.fields
        : (query.fields as string)
            .split(",")
            .map((f) =>
              f
                .trim()
                .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
            )
            .filter(Boolean);
      if (fields.length > 0) {
        select = {};
        fields.forEach((field) => {
          select![field] = true;
        });
      }
    }

    const baseWhere = this.buildWhereWithTenant(where, query.tenantId);
    const finalWhere = this.mergeDataScope(baseWhere);

    const findManyArgs: any = {
      where: finalWhere,
      skip,
      take: pageSize,
      orderBy: this.buildOrderBy(query.sort),
    };
    if (select) findManyArgs.select = select;

    const [list, total] = await Promise.all([
      this.model.findMany(findManyArgs),
      this.model.count({ where: finalWhere }),
    ]);
    const totalPages = Math.ceil(total / pageSize);

    return { list, total, pageNum, pageSize, totalPages };
  }

  // ============================================================
  // 写方法
  // ============================================================

  /**
   * 创建记录
   */
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
    return this.model.create({ data: createData });
  }

  /**
   * 更新记录
   * - 主键 + 租户双重定位，避免跨租户误更新
   */
  async update(
    id: string,
    data: UpdateInput,
    tenantId: string,
    userId?: string,
  ): Promise<T> {
    const exists = await this.findById(id, tenantId);
    if (!exists) throw new AppError("记录不存在", 404001, 404);

    const updateData = {
      ...data,
      [this.updatedByField]: userId || null,
      [this.updatedAtField]: new Date(),
    };

    return this.model.update({
      where: {
        [this.primaryKey]: id,
        [this.tenantField]: tenantId,
      },
      data: updateData,
    });
  }

  /**
   * 软删除
   */
  async softDelete(id: string, tenantId: string, userId?: string): Promise<T> {
    const exists = await this.findById(id, tenantId);
    if (!exists) throw new AppError("记录不存在", 404001, 404);

    return this.model.update({
      where: {
        [this.primaryKey]: id,
        [this.tenantField]: tenantId,
      },
      data: {
        [this.softDeleteField]: SOFT_DELETE_FLAG.DELETED,
        [this.updatedByField]: userId || null,
        [this.updatedAtField]: new Date(),
      },
    });
  }

  /**
   * 物理删除
   */
  async hardDelete(id: string, tenantId: string): Promise<T> {
    const exists = await this.findById(id, tenantId);
    if (!exists) throw new AppError("记录不存在", 404001, 404);

    return this.model.delete({
      where: {
        [this.primaryKey]: id,
        [this.tenantField]: tenantId,
      },
    });
  }

  /**
   * 检查记录是否存在
   */
  async exists(where: WhereInput, tenantId: string): Promise<boolean> {
    const base = this.buildWhereWithTenant(where, tenantId);
    const count = await this.model.count({
      where: this.mergeDataScope(base),
    });
    return count > 0;
  }

  /**
   * 统计记录数
   */
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
    return this.model.createMany({ data: createData, skipDuplicates: true });
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
    if (this.tenantField) where[this.tenantField] = tenantId;

    const result = await this.model.updateMany({
      where,
      data: {
        [this.softDeleteField]: SOFT_DELETE_FLAG.DELETED,
        [this.updatedByField]: userId || null,
        [this.updatedAtField]: new Date(),
      },
    });

    return { count: result.count };
  }

  // ============================================================
  // 内部工具
  // ============================================================

  protected buildWhereWithTenant(where: WhereInput, tenantId: string): any {
    return {
      ...where,
      [this.tenantField]: tenantId,
      [this.softDeleteField]: SOFT_DELETE_FLAG.NORMAL,
    };
  }

  protected buildOrderBy(
    sort?: Array<{ field: string; direction: "asc" | "desc" }>,
  ): any {
    if (!sort || sort.length === 0) {
      return { [this.createdAtField]: "desc" };
    }
    return sort.map((s) => ({ [s.field]: s.direction }));
  }
}
