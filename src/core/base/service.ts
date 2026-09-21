import { BaseRepository } from "./repository.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";

export abstract class BaseService<
  R extends BaseRepository<any, any, any, any>,
> {
  protected readonly repository: R;
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

  protected async transaction<T>(
    callback: (tx: any) => Promise<T>,
  ): Promise<T> {
    return this.repository.transaction(callback);
  }

  protected async assertExists(
    id: string,
    tenantId: string,
    resourceName = "记录",
  ): Promise<any> {
    const record = await this.repository.findById(id, tenantId);
    if (!record) throw new AppError(`${resourceName}不存在`, 404001, 404);
    return record;
  }

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
