import { sendAlert } from "../alert/index.js";
import { logger } from "./logger.js";

export { logger } from "./logger.js";
export { writeAuditLog, type AuditLogEntry } from "./audit-logger.js";
const originalError = logger.error.bind(logger);
(logger as any).error = (obj: any, msg?: string) => {
  originalError(obj, msg);

  // 关键错误推送（可加采样）
  if (msg && /critical|fatal|db.*fail|redis.*fail/i.test(msg)) {
    void sendAlert({ level: "error", message: msg, data: obj });
  }
};
