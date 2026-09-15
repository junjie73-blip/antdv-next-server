// src/core/base-service.ts
import { BaseRepository } from "./repository.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@core/logger/index.js";

/**
 * 通用服务基类
 *
 * 设计原则：
 * - **无状态**：不持有 req/res，不缓存请求上下文
 * - **只依赖 Repository**：通过构造注入
 * - **纯逻辑**：算法、编排、事务
 *
 * 使用：
 * ```ts
 * class UserService extends BaseService<UserRepository> {
 *   constructor(repo: UserRepository) {
 *     super(repo);
 *   }
 * }
 * ```
 *
 * @template R - 该 Service 关联的 Repository 类型
 */
export abstract class BaseService<
  R extends BaseRepository<any, any, any, any>,
> {
  /** 主 Repository（子类可通过 `this.repository` 访问） */
  protected readonly repository: R;

  /** 额外的 Repository（可选，多 Repository 场景） */
  protected readonly extraRepositories: Record<
    string,
    BaseRepository<any, any, any, any>
  >;

  constructor(
    repository: R,
    extraRepositories: Record<string, BaseRepository<any, any, any, any>> = {},
  ) {
    this.repository = repository;
    this.extraRepositories = extraRepositories;
  }

  // ============================================================
  // 事务
  // ============================================================

  /**
   * 执行事务（委托给 repository）
   * 子类可以传入 `tx` 到 Repository 方法
   */
  protected async transaction<T>(
    callback: (tx: any) => Promise<T>,
  ): Promise<T> {
    return this.repository.transaction(callback);
  }

  // ============================================================
  // 校验辅助
  // ============================================================

  /**
   * 断言记录存在
   * @throws NotFoundError
   */
  protected async assertExists(
    id: string,
    tenantId: string,
    resourceName = "记录",
  ): Promise<any> {
    const record = await this.repository.findById(id, tenantId);
    if (!record) {
      throw new AppError(`${resourceName}不存在`, 404001, 404);
    }
    return record;
  }

  /**
   * 断言唯一性
   * @param checkFn 检查函数，返回已存在的记录则抛错
   */
  protected async assertUnique(
    checkFn: () => Promise<any>,
    fieldName: string,
    value: string,
  ): Promise<void> {
    const existing = await checkFn();
    if (existing) {
      throw new AppError(`${fieldName} '${value}' 已存在`, 409001, 409);
    }
  }

  // ============================================================
  // 日志辅助
  // ============================================================

  protected log(action: string, data: Record<string, any> = {}): void {
    logger.info(
      { service: this.constructor.name, action, ...data },
      `[${this.constructor.name}] ${action}`,
    );
  }

  protected logError(
    action: string,
    err: unknown,
    data: Record<string, any> = {},
  ): void {
    logger.error(
      { service: this.constructor.name, action, err, ...data },
      `[${this.constructor.name}] ${action} failed`,
    );
  }
}
