import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";

export interface AuditLogEntry {
  tenantId: string;
  userId?: string | null;
  username?: string | null;
  operation: string;
  method: string;
  requestUrl: string;
  requestParams?: Record<string, unknown> | null;
  responseData?: Record<string, unknown> | null;
  ipAddress: string;
  userAgent?: string | null;
  executeTime: number;
  status: string;
  errorMsg?: string | null;
}

/** 单条直接写库（低频，同步语义） */
export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.sys_audit_log.create({
      data: {
        tenant_id: entry.tenantId,
        user_id: entry.userId ?? null,
        username: entry.username ?? null,
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
        user_agent: entry.userAgent ?? null,
        execute_time: entry.executeTime,
        status: entry.status,
        error_msg: entry.errorMsg ?? null,
      },
    });
  } catch (err) {
    logger.error({ err }, "Failed to write audit log");
  }
}

/** 批量写库（供队列调用） */
export async function writeAuditBatch(entries: AuditLogEntry[]): Promise<void> {
  if (entries.length === 0) return;
  await prisma.sys_audit_log.createMany({
    data: entries.map((it) => ({
      tenant_id: it.tenantId,
      user_id: it.userId ?? null,
      username: it.username ?? null,
      operation: it.operation,
      method: it.method,
      request_url: it.requestUrl,
      request_params: it.requestParams
        ? JSON.stringify(it.requestParams)
        : null,
      response_data: it.responseData ? JSON.stringify(it.responseData) : null,
      ip_address: it.ipAddress,
      user_agent: it.userAgent ?? null,
      execute_time: it.executeTime,
      status: it.status,
      error_msg: it.errorMsg ?? null,
    })),
  });
}
