import { ExportHandler } from "@/modules/export/handlers/types.js";
import { orgHistoryExportHandler } from "./org-history.handler.js";
import { userExportHandler } from "@/modules/export/handlers/user.handler.js";
import { auditLogExportHandler } from "@/modules/export/handlers/audit-log.handler.js";
export const EXPORT_HANDLERS: Record<string, ExportHandler> = {
  user: userExportHandler,
  audit_log: auditLogExportHandler,
  org_history: orgHistoryExportHandler, // ⭐ 新增
};
