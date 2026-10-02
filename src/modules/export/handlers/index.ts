import { userExportHandler } from "./user.handler.js";
import { auditLogExportHandler } from "./audit-log.handler.js";
import type { ExportHandler } from "./types.js";

export const EXPORT_HANDLERS: Record<string, ExportHandler> = {
  user: userExportHandler,
  audit_log: auditLogExportHandler,
  // ... 后续新增只需注册
};

export function getExportHandler(bizType: string): ExportHandler {
  const h = EXPORT_HANDLERS[bizType];
  if (!h) throw new Error(`Unsupported export bizType: ${bizType}`);
  return h;
}
