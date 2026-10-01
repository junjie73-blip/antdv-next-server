/**
 * 导出错误分类
 */
export enum ExportErrorType {
  /** 可重试：网络、DB 超时、对象存储临时失败 */
  RETRYABLE = "retryable",
  /** 不可重试：SQL 语法错误、参数错误、权限不足 */
  FATAL = "fatal",
  /** 未知：默认按可重试处理 */
  UNKNOWN = "unknown",
}

export interface ExportErrorInfo {
  type: ExportErrorType;
  message: string;
  /** 建议重试延迟（毫秒），不填则用默认策略 */
  retryAfterMs?: number;
}

/**
 * 判定错误是否可重试
 */
export function classifyExportError(err: any): ExportErrorInfo {
  const message = String(err?.message ?? err ?? "未知错误");
  const code = err?.code ?? err?.statusCode ?? 0;

  /* ============================================================
   * 致命错误（不重试）
   * ============================================================ */
  // SQL 校验失败
  if (
    message.includes("SQL 校验失败") ||
    message.includes("只允许 SELECT") ||
    message.includes("禁止使用关键字")
  ) {
    return { type: ExportErrorType.FATAL, message };
  }

  // 参数错误
  if (message.includes("缺少必填参数") || message.includes("参数校验失败")) {
    return { type: ExportErrorType.FATAL, message };
  }

  // 权限不足
  if (
    message.includes("无权") ||
    message.includes("缺少权限") ||
    message.includes("Forbidden")
  ) {
    return { type: ExportErrorType.FATAL, message };
  }

  // 报表/数据集不存在
  if (
    message.includes("不存在") &&
    (message.includes("报表") || message.includes("数据集"))
  ) {
    return { type: ExportErrorType.FATAL, message };
  }

  /* ============================================================
   * 可重试错误
   * ============================================================ */
  // 数据库超时
  if (message.includes("查询超时") || code === 408001) {
    return {
      type: ExportErrorType.RETRYABLE,
      message,
      retryAfterMs: 10_000,
    };
  }

  // 对象存储失败
  if (
    message.includes("storage") ||
    message.includes("S3") ||
    message.includes("COS") ||
    message.includes("OSS") ||
    message.includes("upload failed")
  ) {
    return {
      type: ExportErrorType.RETRYABLE,
      message,
      retryAfterMs: 5_000,
    };
  }

  // 网络错误
  if (
    message.includes("ECONNRESET") ||
    message.includes("ETIMEDOUT") ||
    message.includes("ENOTFOUND") ||
    message.includes("socket hang up")
  ) {
    return {
      type: ExportErrorType.RETRYABLE,
      message,
      retryAfterMs: 3_000,
    };
  }

  // Redis / 队列错误
  if (message.includes("Redis") || message.includes("BullMQ")) {
    return {
      type: ExportErrorType.RETRYABLE,
      message,
      retryAfterMs: 5_000,
    };
  }

  // 未知错误，按可重试处理（保守策略）
  return { type: ExportErrorType.UNKNOWN, message };
}
