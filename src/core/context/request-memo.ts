import type { Request } from "express";

type MemoStore = Map<string, Promise<unknown>>;

export function memoRequest<T>(
  req: Request,
  key: string,
  loader: () => Promise<T>,
): Promise<T> {
  let store = (req as any).__memo as MemoStore | undefined;
  if (!store) {
    store = new Map();
    (req as any).__memo = store;
  }
  const hit = store.get(key);
  if (hit) return hit as Promise<T>;
  const p = loader();
  store.set(key, p);
  return p;
}
