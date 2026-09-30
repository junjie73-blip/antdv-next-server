export * from "./codes.js";

/** 统一错误响应 */
export interface ApiError {
  code: number;
  message: string;
  data: null;
  traceId?: string;
  timestamp: number;
}
