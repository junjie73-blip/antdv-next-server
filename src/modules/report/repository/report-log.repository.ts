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

  async findPage(params: ReportLogListParams) {
    const { tenantId, reportCode, exportType, status, pageNum, pageSize } =
      params;

    const where: Prisma.rp_report_logWhereInput = { tenant_id: tenantId };
    if (reportCode) where.report_code = reportCode;
    if (exportType) where.export_type = exportType;
    if (status) where.status = status;

    const [list, total] = await Promise.all([
      this.model.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      this.model.count({ where }),
    ]);

    return {
      list,
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async create(data: Prisma.rp_report_logUncheckedCreateInput) {
    return this.model.create({ data });
  }
}
