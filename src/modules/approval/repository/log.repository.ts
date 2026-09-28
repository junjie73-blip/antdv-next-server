import { Prisma } from "@/generated/prisma/client.js";
import { BaseRepository } from "@/core/index.js";
import { prisma } from "@/config/index.js";
import type { ApprovalLogQueryDTO } from "../schema.js";

export interface ApprovalLogRaw {
  log_id: string;
  tenant_id: string;
  request_id: string;
  operator_id: string;
  operator_name: string;
  action: string;
  from_status: string | null;
  to_status: string | null;
  remark: string | null;
  reason_type: string | null;
  created_at: Date;
}

export class ApprovalLogRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.sys_approval_log;
  protected readonly primaryKey = "log_id";
  protected readonly tenantField = "tenant_id";

  /**
   * 覆写分页 —— 必须合并数据权限
   */
  async findLogPage(dto: ApprovalLogQueryDTO, tenantId: string) {
    const where: Prisma.sys_approval_logWhereInput = {
      tenant_id: tenantId,
    };
    if (dto.action) where.action = dto.action;
    if (dto.operatorName) where.operator_name = { contains: dto.operatorName };
    // title 走 request 子查询（无数据库外键，两步查询）
    let requestIds: string[] | undefined;
    if (dto.title) {
      const matched = await prisma.sys_approval_request.findMany({
        where: {
          tenant_id: tenantId,
          is_deleted: 0,
          title: { contains: dto.title },
        },
        select: { request_id: true },
        take: 500,
      });
      requestIds = matched.map((r) => r.request_id);
      if (requestIds.length === 0) {
        return { list: [] as ApprovalLogRaw[], total: 0 };
      }
      where.request_id = { in: requestIds };
    }

    const finalWhere = this.mergeDataScope(where);

    const [list, total] = await Promise.all([
      this.model.findMany({
        where: finalWhere,
        orderBy: { created_at: "desc" },
        skip: (dto.page - 1) * dto.pageSize,
        take: dto.pageSize,
      }),
      this.model.count({ where: finalWhere }),
    ]);
    return { list: list as ApprovalLogRaw[], total };
  }

  /**
   * 批量查询申请标题
   */
  async findRequestTitles(
    requestIds: string[],
    tenantId: string,
  ): Promise<Map<string, string>> {
    if (requestIds.length === 0) return new Map();
    const rows = await prisma.sys_approval_request.findMany({
      where: {
        request_id: { in: requestIds },
        tenant_id: tenantId,
        is_deleted: 0,
      },
      select: { request_id: true, title: true },
    });
    return new Map(rows.map((r) => [r.request_id, r.title]));
  }
}
