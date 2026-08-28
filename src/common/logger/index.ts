import pino from "pino";
import { env } from "@/config/env.js";

const targets: pino.TransportTargetOptions[] = [];

// 生产环境推送到 Logtail
if (env.NODE_ENV === "production" && process.env.LOGTAIL_SOURCE_TOKEN) {
  targets.push({
    target: "@logtail/pino",
    options: { sourceToken: process.env.LOGTAIL_SOURCE_TOKEN },
    level: env.LOG_LEVEL,
  });
} else {
  // 开发环境：美观输出
  targets.push({
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
      ignore: "pid,hostname",
    },
    level: env.LOG_LEVEL,
  });
}

// 文件输出（所有环境）
targets.push({
  target: "pino/file",
  options: { destination: "./logs/app.log", mkdir: true },
  level: "info",
});

// 错误日志单独文件
targets.push({
  target: "pino/file",
  options: { destination: "./logs/error.log", mkdir: true },
  level: "error",
});

export const logger = pino(
  {
    level: env.LOG_LEVEL,
    base: { pid: process.pid, env: env.NODE_ENV },
  },
  pino.transport({ targets }),
);

// 分级快捷方法
export const logInfo = (msg: string, obj?: any) => logger.info(obj, msg);
export const logWarn = (msg: string, obj?: any) => logger.warn(obj, msg);
export const logError = (msg: string, obj?: any) => logger.error(obj, msg);
export const logFatal = (msg: string, obj?: any) => logger.fatal(obj, msg);

// 审计日志（业务操作）
export function auditLog(
  action: string,
  tenantId: string,
  userId?: string,
  details?: any,
) {
  logger.info({ type: "audit", action, tenantId, userId, details }, "AUDIT");
}
