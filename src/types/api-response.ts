/**
 * API 统一响应结构
 * 所有接口返回必须使用该结构
 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
  timestamp: number;
  traceId?: string;
}

/**
 * 分页响应数据结构
 */
export interface PageResponse<T> {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
  totalPages: number;
}
