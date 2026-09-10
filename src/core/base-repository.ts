import { prisma } from "@/config/database.js";
import {
  IBaseRepository,
  BaseQuery,
  PageResult,
  QueryOptions,
  SOFT_DELETE_FLAG,
} from "@/types/base-repository.js";
import { AppError } from "@/middleware/error-handler.js";
import { Prisma } from "@/generated/prisma/index.js";

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

  /**
   * 根据 ID 查询（自动附加租户和软删除过滤）
   */
  async findById(id: string, tenantId: string): Promise<T | null> {
    const where = this.buildWhereWithTenant(
      { [this.primaryKey]: id } as WhereInput,
      tenantId,
    );

    return this.model.findFirst({
      where: {
        ...where,
        [this.softDeleteField]: SOFT_DELETE_FLAG.NORMAL,
      },
    });
  }

  /**
   * 根据条件查询单条
   */
  async findOne(where: WhereInput, tenantId: string): Promise<T | null> {
    const finalWhere = this.buildWhereWithTenant(where, tenantId);

    return this.model.findFirst({
      where: {
        ...finalWhere,
        [this.softDeleteField]: SOFT_DELETE_FLAG.NORMAL,
      },
    });
  }

  /**
   * 根据条件查询多条
   */
  async findMany(where: WhereInput, options: QueryOptions = {}): Promise<T[]> {
    const { skip, take, orderBy, include } = options;
    const finalWhere = {
      ...where,
      [this.softDeleteField]: SOFT_DELETE_FLAG.NORMAL,
    };

    return this.model.findMany({
      where: finalWhere,
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

    const finalWhere = this.buildWhereWithTenant(where, query.tenantId);
    const findManyArgs: any = {
      where: finalWhere,
      skip,
      take: pageSize,
      orderBy: this.buildOrderBy(query.sort),
    };

    // 如果有 select，则添加
    if (select) {
      findManyArgs.select = select;
    }

    const [list, total] = await Promise.all([
      this.model.findMany(findManyArgs),
      this.model.count({ where: finalWhere }),
    ]);
    const totalPages = Math.ceil(total / pageSize);

    return {
      list,
      total,
      pageNum,
      pageSize,
      totalPages,
    };
  }

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
   */
  async update(
    id: string,
    data: UpdateInput,
    tenantId: string,
    userId?: string,
  ): Promise<T> {
    const exists = await this.findById(id, tenantId);
    if (!exists) {
      throw new AppError(404, "记录不存在", 404);
    }

    const updateData = {
      ...data,
      [this.updatedByField]: userId || null,
      [this.updatedAtField]: new Date(),
    };

    return this.model.update({
      where: { [this.primaryKey]: id },
      data: updateData,
    });
  }

  /**
   * 软删除
   */
  async softDelete(id: string, tenantId: string, userId?: string): Promise<T> {
    const exists = await this.findById(id, tenantId);
    if (!exists) {
      throw new AppError(404, "记录不存在", 404);
    }

    return this.model.update({
      where: { [this.primaryKey]: id },
      data: {
        [this.softDeleteField]: SOFT_DELETE_FLAG.DELETED,
        [this.updatedByField]: userId || null,
        [this.updatedAtField]: new Date(),
      },
    });
  }

  /**
   * 物理删除（谨慎使用）
   */
  async hardDelete(id: string, tenantId: string): Promise<T> {
    const exists = await this.findById(id, tenantId);
    if (!exists) {
      throw new AppError(404, "记录不存在", 404);
    }

    return this.model.delete({
      where: { [this.primaryKey]: id },
    });
  }

  /**
   * 检查记录是否存在
   */
  async exists(where: WhereInput, tenantId: string): Promise<boolean> {
    const finalWhere = this.buildWhereWithTenant(where, tenantId);
    const count = await this.model.count({
      where: {
        ...finalWhere,
        [this.softDeleteField]: SOFT_DELETE_FLAG.NORMAL,
      },
    });
    return count > 0;
  }

  /**
   * 统计记录数
   */
  async count(where: WhereInput, tenantId: string): Promise<number> {
    const finalWhere = this.buildWhereWithTenant(where, tenantId);
    return this.model.count({
      where: {
        ...finalWhere,
        [this.softDeleteField]: SOFT_DELETE_FLAG.NORMAL,
      },
    });
  }

  /**
   * 事务处理
   */
  async transaction<R>(callback: (tx: any) => Promise<R>): Promise<R> {
    return prisma.$transaction(async (tx) => {
      return callback(tx);
    });
  }

  /**
   * 批量创建
   */
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

    return this.model.createMany({ data: createData });
  }

  /**
   * 批量软删除
   */
  async softDeleteMany(
    ids: string[],
    tenantId: string,
    userId?: string,
  ): Promise<{ count: number }> {
    console.log(this.primaryKey, "this.primaryKey", ids);
    // 校验 ids 必须是非空数组
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError(400, "ids 参数必须是非空数组", 400);
    }

    const where: any = {
      [this.primaryKey]: { in: ids },
      [this.softDeleteField]: SOFT_DELETE_FLAG.NORMAL,
    };
    if (this.tenantField) {
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

    return { count: result.count };
  }

  /**
   * 构建带租户的查询条件
   * @protected
   */
  protected buildWhereWithTenant(where: WhereInput, tenantId: string): any {
    return {
      ...where,
      [this.tenantField]: tenantId,
      [this.softDeleteField]: SOFT_DELETE_FLAG.NORMAL,
    };
  }

  /**
   * 构建排序条件
   * @protected
   */
  protected buildOrderBy(
    sort?: Array<{ field: string; direction: "asc" | "desc" }>,
  ): any {
    if (!sort || sort.length === 0) {
      return { [this.createdAtField]: "desc" };
    }
    return sort.map((s) => ({ [s.field]: s.direction }));
  }
}
