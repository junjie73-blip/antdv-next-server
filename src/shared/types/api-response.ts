export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
  traceId?: string;
}

export interface PageResponse<T = unknown> {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
  totalPages: number;
}

export interface PageQuery {
  pageNum: number;
  pageSize: number;
  tenantId?: string;
}
