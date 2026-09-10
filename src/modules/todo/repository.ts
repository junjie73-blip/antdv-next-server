import { BaseRepository } from "@/core/base-repository.js";
import { prisma } from "@/config/database.js";
import { AppError } from "@/middleware/error-handler.js";

export class TodoRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.sys_todo;
  protected readonly primaryKey = "todo_id";
  protected readonly tenantField = "tenant_id";

  async findPage(query: any, where: any) {
    const pageNum = Math.max(1, query.pageNum || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 20));
    const skip = (pageNum - 1) * pageSize;
    const finalWhere: any = {
      ...where,
      tenant_id: query.tenantId,
      is_deleted: 0,
    };
    if (query.userId) finalWhere.user_id = query.userId;
    if (query.status !== undefined && query.status !== "")
      finalWhere.status = query.status;
    if (query.priority !== undefined && query.priority !== "")
      finalWhere.priority = Number(query.priority);

    const [list, total] = await Promise.all([
      this.model.findMany({
        where: finalWhere,
        skip,
        take: pageSize,
        orderBy: [
          { status: "asc" },
          { priority: "desc" },
          { created_at: "desc" },
        ],
      }),
      this.model.count({ where: finalWhere }),
    ]);
    return {
      list,
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async complete(id: string, tenantId: string) {
    const todo = await this.model.findFirst({
      where: { todo_id: id, tenant_id: tenantId, is_deleted: 0 },
    });
    if (!todo) throw new AppError(404, "待办不存在", 404);
    return this.model.update({ where: { todo_id: id }, data: { status: "1" } });
  }

  async stats(userId: string, tenantId: string) {
    const [all, uncompleted, completed, overdue] = await Promise.all([
      this.model.count({
        where: { tenant_id: tenantId, user_id: userId, is_deleted: 0 },
      }),
      this.model.count({
        where: {
          tenant_id: tenantId,
          user_id: userId,
          is_deleted: 0,
          status: "0",
        },
      }),
      this.model.count({
        where: {
          tenant_id: tenantId,
          user_id: userId,
          is_deleted: 0,
          status: "1",
        },
      }),
      this.model.count({
        where: {
          tenant_id: tenantId,
          user_id: userId,
          is_deleted: 0,
          status: "0",
          due_time: { lt: new Date() },
        },
      }),
    ]);
    return { all, uncompleted, completed, overdue };
  }
}
