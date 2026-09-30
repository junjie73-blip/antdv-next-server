/** 统一 API 响应 */
export interface ApiResponse<T = unknown> {
    code: number;
    message: string;
    data: T;
    traceId?: string;
    timestamp: number;
}
/** 分页响应 */
export interface PageResponse<T = unknown> {
    list: T[];
    total: number;
    pageNum: number;
    pageSize: number;
    totalPages: number;
}
/** 分页入参 */
export interface PageQuery {
    pageNum: number;
    pageSize: number;
}
/** 排序 */
export interface SortQuery {
    field: string;
    direction: "asc" | "desc";
}
/** 时间范围 */
export interface DateRange {
    start: string;
    end: string;
}
//# sourceMappingURL=common.d.ts.map