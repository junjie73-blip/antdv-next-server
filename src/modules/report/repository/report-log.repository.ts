import { prisma } from "@/config/database.js";
import { Prisma } from "@/generated/prisma/client.js";
import { BaseRepository } from "@/core/index.js";

export interface ReportLogListParams {
  tenantId?: string;
  reportCode?: string;
  exportType?: string;
  status?: string;
  pageNum?: number;
  pageSize?: number;
}

export class RpReportLogRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.rp_report_log;
  protected readonly primaryKey = "log_id";
  protected readonly tenantField = "tenant_id";
  async create(data: Prisma.rp_report_logUncheckedCreateInput) {
    return this.model.create({ data });
  }
}
