import { BaseRepository } from "@/core/base/repository.js";
import { prisma } from "@/config/database.js";
import { AppError } from "@/middleware/error-handler.js";

export class TodoRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.sys_todo;
  protected readonly primaryKey = "todo_id";
  protected readonly tenantField = "tenant_id";

  async complete(id: string, tenantId: string) {
    const todo = await this.model.findFirst({
      where: { todo_id: id, tenant_id: tenantId, is_deleted: 0 },
    });
    if (!todo) throw new AppError("待办不存在", 404, 404);
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
