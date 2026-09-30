import type { PageQuery, PageResponse } from "../types/common.js";

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export function normalizePage(query: Partial<PageQuery>): PageQuery {
  const pageNum = Math.max(1, Number(query.pageNum) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(query.pageSize) || DEFAULT_PAGE_SIZE),
  );
  return { pageNum, pageSize };
}

export function buildPageResponse<T>(
  list: T[],
  total: number,
  pageNum: number,
  pageSize: number,
): PageResponse<T> {
  return {
    list,
    total,
    pageNum,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
