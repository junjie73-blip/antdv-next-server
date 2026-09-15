import { BaseRepository } from "@/core/base/repository.js";
import { prisma } from "@/config/database.js";
import { BaseQuery, PageResult } from "@/types/base-repository.js";
import { keysToCamelCase } from "@/common/utils/case-convert.js";
import dayjs from "dayjs";

export class LoginLogRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.sys_login_log;
  protected readonly primaryKey = "log_id";
  async findPage(query: BaseQuery, where: any): Promise<PageResult<any>> {
    const finalWhere: any = { ...where, tenant_id: query.tenantId };
    if (query.username) finalWhere.username = { contains: query.username };
    if (query.status !== undefined) finalWhere.status = query.status;
    if (query.startTime)
      finalWhere.created_at = {
        ...(finalWhere.created_at || {}),
        gte: new Date(query.startTime as string),
      };
    if (query.endTime)
      finalWhere.created_at = {
        ...(finalWhere.created_at || {}),
        lte: new Date(query.endTime as string),
      };
    return this.paginate({ ...query, maxPageSize: 100 }, finalWhere);
  }

  async findAll(where: any): Promise<any[]> {
    return this.model.findMany({
      where,
      orderBy: { created_at: "desc" },
    });
  }
}
