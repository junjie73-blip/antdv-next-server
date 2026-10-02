import { CacheRepository } from "../repository.js";
import { OPERATION_TYPE } from "../constants.js";

export class CacheOperationService {
  private repo = new CacheRepository();

  async recordClearGroup(
    tenantId: string,
    operatorId: string,
    operatorName: string,
    group: string,
    count: number,
    durationMs: number,
  ) {
    await this.repo.log({
      tenantId,
      operatorId,
      operatorName,
      operation: OPERATION_TYPE.CLEAR_GROUP,
      target: group,
      keyCount: count,
      durationMs,
      status: "1",
    });
  }

  async recordDeleteKey(
    tenantId: string,
    operatorId: string,
    operatorName: string,
    key: string,
    deleted: number,
    durationMs: number,
  ) {
    await this.repo.log({
      tenantId,
      operatorId,
      operatorName,
      operation: OPERATION_TYPE.DELETE_KEY,
      target: key,
      keyCount: deleted,
      durationMs,
      status: "1",
    });
  }

  async recordFailure(
    tenantId: string,
    operatorId: string,
    operatorName: string,
    operation: string,
    target: string,
    error: string,
  ) {
    await this.repo.log({
      tenantId,
      operatorId,
      operatorName,
      operation,
      target,
      status: "0",
      errorMsg: error.slice(0, 500),
    });
  }

  async list(tenantId: string, pageNum: number, pageSize: number) {
    return this.repo.findPage(tenantId, pageNum, pageSize);
  }
}

export const cacheOperationService = new CacheOperationService();
