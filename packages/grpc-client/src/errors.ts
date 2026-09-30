import { status } from "@grpc/grpc-js";
import { ERROR_CODE } from "@saas/contracts/errors";

export interface GrpcError extends Error {
  code: number;
  details?: string;
  metadata?: Record<string, unknown>;
}

/**
 * gRPC 状态码 → HTTP 风格错误码
 */
export function mapGrpcStatusToErrorCode(grpcCode: number): number {
  switch (grpcCode) {
    case status.INVALID_ARGUMENT:
      return ERROR_CODE.VALIDATION_FAILED;
    case status.NOT_FOUND:
      return ERROR_CODE.RESOURCE_NOT_FOUND;
    case status.ALREADY_EXISTS:
      return ERROR_CODE.RESOURCE_EXISTS;
    case status.PERMISSION_DENIED:
      return ERROR_CODE.PERMISSION_DENIED;
    case status.UNAUTHENTICATED:
      return ERROR_CODE.UNAUTHORIZED;
    case status.DEADLINE_EXCEEDED:
      return ERROR_CODE.EXTERNAL_SERVICE_ERROR;
    case status.UNAVAILABLE:
      return ERROR_CODE.UPSTREAM_UNAVAILABLE;
    case status.INTERNAL:
    default:
      return ERROR_CODE.EXTERNAL_SERVICE_ERROR;
  }
}

/**
 * 把 gRPC 调用错误包装为标准 Error
 */
export function normalizeGrpcError(err: any): GrpcError {
  const grpcCode = err?.code ?? status.UNKNOWN;
  const normalized = new Error(
    err?.details ?? err?.message ?? "gRPC call failed",
  ) as GrpcError;
  normalized.code = mapGrpcStatusToErrorCode(grpcCode);
  normalized.details = err?.details;
  return normalized;
}
