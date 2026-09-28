import { BaseRepository } from "@/core/base/repository.js";
import { prisma } from "@/config/database.js";
import { AppError } from "@/core/errors.js";

export class TodoGroupRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.sys_todo_group;
  protected readonly primaryKey = "group_id";

  /** 当前用户的全部分组 */
  async findByUser(userId: string, tenantId: string) {
    return this.model.findMany({
      where: {
        user_id: userId,
        tenant_id: tenantId,
        is_deleted: 0,
      },
      orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
    });
  }

  /** 校验分组归属当前用户 */
  async findOneForUser(groupId: string, userId: string, tenantId: string) {
    return this.model.findFirst({
      where: {
        group_id: groupId,
        user_id: userId,
        tenant_id: tenantId,
        is_deleted: 0,
      },
    });
  }

  /** 检查同用户下名称是否重复 */
  async findByName(
    name: string,
    userId: string,
    tenantId: string,
    excludeId?: string,
  ) {
    const where: any = {
      user_id: userId,
      tenant_id: tenantId,
      name,
      is_deleted: 0,
    };
    if (excludeId) where.group_id = { not: excludeId };
    return this.model.findFirst({ where });
  }

  /** 创建（自动注入 user_id / tenant_id） */
  async createForUser(
    data: { name: string; color?: string; sortOrder?: number },
    userId: string,
    tenantId: string,
  ) {
    return this.model.create({
      data: {
        name: data.name,
        color: data.color ?? null,
        sort_order: data.sortOrder ?? 0,
        user_id: userId,
        tenant_id: tenantId,
        created_by: userId,
        updated_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
        is_deleted: 0,
      },
    });
  }

  /** 更新（先校验归属） */
  async updateForUser(
    id: string,
    data: { name?: string; color?: string; sortOrder?: number },
    userId: string,
    tenantId: string,
  ) {
    const exists = await this.findOneForUser(id, userId, tenantId);
    if (!exists) throw new AppError("分组不存在", 404001, 404);

    const updateData: any = {
      updated_by: userId,
      updated_at: new Date(),
    };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.sortOrder !== undefined) updateData.sort_order = data.sortOrder;

    return this.model.update({
      where: { group_id: id },
      data: updateData,
    });
  }

  /** 软删除（先校验归属 + 校验分组下是否有待办） */
  async softDeleteForUser(id: string, userId: string, tenantId: string) {
    const exists = await this.findOneForUser(id, userId, tenantId);
    if (!exists) throw new AppError("分组不存在", 404001, 404);

    const todoCount = await prisma.sys_todo.count({
      where: { group_id: id, tenant_id: tenantId, is_deleted: 0 },
    });
    if (todoCount > 0) {
      throw new AppError(
        `该分组下还有 ${todoCount} 条待办，请先移出或删除`,
        400001,
        400,
      );
    }

    return this.model.update({
      where: { group_id: id },
      data: {
        is_deleted: 1,
        updated_by: userId,
        updated_at: new Date(),
      },
    });
  }
}
