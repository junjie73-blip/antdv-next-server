import { prisma } from "@config/database.js";
import { logger } from "./logger.js";

export interface AuditLogEntry {
  tenantId: string;
  userId?: string;
  username?: string;
  operation: string;
  method: string;
  requestUrl: string;
  requestParams?: Record<string, unknown>;
  responseData?: Record<string, unknown>;
  ipAddress: string;
  userAgent?: string;
  executeTime: number;
  status: string;
  errorMsg?: string;
}

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.sys_audit_log.create({
      data: {
        tenant_id: entry.tenantId,
        user_id: entry.userId,
        username: entry.username,
        operation: entry.operation,
        method: entry.method,
        request_url: entry.requestUrl,
        request_params: entry.requestParams
          ? JSON.stringify(entry.requestParams)
          : null,
        response_data: entry.responseData
          ? JSON.stringify(entry.responseData)
          : null,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        execute_time: entry.executeTime,
        status: entry.status,
        error_msg: entry.errorMsg,
      },
    });
    logger.info(
      { audit: true, operation: entry.operation, user: entry.username },
      "Audit log recorded",
    );
  } catch (err) {
    logger.error({ err }, "Failed to write audit log");
  }
}
