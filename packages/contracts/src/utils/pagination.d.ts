import type { PageQuery, PageResponse } from "../types/common.js";
export declare const DEFAULT_PAGE_SIZE = 10;
export declare const MAX_PAGE_SIZE = 100;
export declare function normalizePage(query: Partial<PageQuery>): PageQuery;
export declare function buildPageResponse<T>(list: T[], total: number, pageNum: number, pageSize: number): PageResponse<T>;
//# sourceMappingURL=pagination.d.ts.map