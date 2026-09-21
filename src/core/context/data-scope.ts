import { AsyncLocalStorage } from "node:async_hooks";
import { AppError } from "@/core/errors.js";

export interface DataScopeContext {
  userId: string;
  tenantId: string;
  deptIds: string[] | "*";
  selfOnly: boolean;
}

interface Store {
  dataScope: DataScopeContext;
  whereScope: Record<string, unknown>;
}

export const dataScopeStorage = new AsyncLocalStorage<Store>();

export function getDataScope(): DataScopeContext {
  const s = dataScopeStorage.getStore();
  if (!s) throw new AppError("数据权限上下文缺失", 500001, 500);
  return s.dataScope;
}

export function getDataScopeWhere(): Record<string, unknown> {
  const s = dataScopeStorage.getStore();
  if (!s) throw new AppError("数据权限上下文缺失", 500001, 500);
  return s.whereScope;
}

export function runWithDataScope<T>(
  dataScope: DataScopeContext,
  whereScope: Record<string, unknown>,
  fn: () => T,
): T {
  return dataScopeStorage.run({ dataScope, whereScope }, fn);
}
