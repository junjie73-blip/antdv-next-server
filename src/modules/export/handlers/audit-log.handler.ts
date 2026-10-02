import { prisma } from "@/config/database.js";
import type { ExportContext, ExportHandler, ExportResult } from "./types.js";

const BATCH_SIZE = 2000;

export const auditLogExportHandler: ExportHandler = {
  bizType: "audit_log",
  label: "审计日志",
  columns: [
    { header: "日志ID", key: "log_id", width: 36 },
    { header: "用户名", key: "username", width: 20 },
    { header: "操作", key: "operation", width: 30 },
    { header: "方法", key: "method", width: 10 },
    { header: "请求URL", key: "request_url", width: 40 },
    { header: "IP地址", key: "ip_address", width: 20 },
    {
      header: "状态",
      key: "status",
      width: 10,
      formatter: (v: string) => (v === "1" ? "成功" : "失败"),
    },
    { header: "执行时间ms", key: "execute_time", width: 14 },
    { header: "创建时间", key: "created_at", width: 22 },
  ],

  async execute(ctx: ExportContext): Promise<ExportResult> {
    const { tenantId, queryParams } = ctx;
    const where: any = { tenant_id: tenantId };

    if (queryParams.username)
      where.username = { contains: queryParams.username };
    if (queryParams.operation)
      where.operation = { contains: queryParams.operation };
    if (queryParams.method)
      where.method = String(queryParams.method).toUpperCase();
    if (queryParams.status !== undefined) where.status = queryParams.status;
    if (queryParams.startTime || queryParams.endTime) {
      where.created_at = {};
      if (queryParams.startTime)
        where.created_at.gte = new Date(queryParams.startTime);
      if (queryParams.endTime)
        where.created_at.lte = new Date(queryParams.endTime);
    }

    const totalCount = await prisma.sys_audit_log.count({ where });

    async function* rows() {
      let cursor: string | undefined;
      while (true) {
        const batch = await prisma.sys_audit_log.findMany({
          where,
          take: BATCH_SIZE,
          ...(cursor ? { skip: 1, cursor: { log_id: cursor } } : {}),
          orderBy: { log_id: "asc" },
        });
        if (batch.length === 0) break;
        for (const l of batch) yield l;
        cursor = batch[batch.length - 1].log_id;
        if (batch.length < BATCH_SIZE) break;
      }
    }

    return { rows: rows(), totalCount, fileBaseName: "audit-logs" };
  },
};
