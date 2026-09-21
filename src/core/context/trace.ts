import { AsyncLocalStorage } from "node:async_hooks";

export interface TraceContext {
  traceId: string;
}

export const traceStorage = new AsyncLocalStorage<TraceContext>();

export function getTraceId(): string | undefined {
  return traceStorage.getStore()?.traceId;
}
