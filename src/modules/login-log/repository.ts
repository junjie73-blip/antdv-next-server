import { BaseRepository } from "@/core/base-repository.js";
import { prisma } from "@/config/database.js";
import { BaseQuery, PageResult } from "@/types/base-repository.js";
import { keysToCamelCase } from "@/common/utils/case-convert.js";
import dayjs from "dayjs";

export class LoginLogRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.sys_login_log;
  protected readonly primaryKey = "login_log_id";
  async findPage(
    query: BaseQuery & {
      username?: string;
      status?: string;
      startTime?: string;
      endTime?: string;
    },
    where: any,
  ): Promise<PageResult<any>> {
    const pageNum = Math.max(1, query.pageNum || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 10));
    const skip = (pageNum - 1) * pageSize;

    const finalWhere: any = {
      ...where,
      tenant_id: query.tenantId,
    };

    if (query.username) finalWhere.username = { contains: query.username };
    if (query.status !== undefined) finalWhere.status = query.status;
    if (query.startTime)
      finalWhere.created_at = {
        ...(finalWhere.created_at || {}),
        gte: new Date(query.startTime),
      };
    if (query.endTime)
      finalWhere.created_at = {
        ...(finalWhere.created_at || {}),
        lte: new Date(query.endTime),
      };

    const scopedWhere = this.mergeDataScope(finalWhere);
    const [list, total] = await Promise.all([
      this.model.findMany({
        where: scopedWhere,
        skip,
        take: pageSize,
        orderBy: { created_at: "desc" },
      }),
      this.model.count({ where: scopedWhere }),
    ]);

    return {
      list: list.map(keysToCamelCase).map((item: any) => {
        for (const key in item) {
          if (item[key] instanceof Date) {
            item[key] = dayjs(item[key]).format("YYYY-MM-DD HH:mm:ss");
          }
        }
        return item;
      }),
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findAll(where: any): Promise<any[]> {
    return this.model.findMany({
      where,
      orderBy: { created_at: "desc" },
    });
  }
}
