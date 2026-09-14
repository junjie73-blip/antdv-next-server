import { BaseRepository } from "@/core/base-repository.js";
import { prisma } from "@/config/database.js";
import { BaseQuery, PageResult } from "@/types/base-repository.js";
import { keysToCamelCase } from "@/common/utils/case-convert.js";
import { AppError } from "@/middleware/error-handler.js";

export class DeptRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.sys_dept;
  protected readonly primaryKey = "dept_id";

  async findTree(tenantId: string, options: any = {}): Promise<any[]> {
    const depts = await this.model.findMany({
      where: {
        tenant_id: tenantId,
        is_deleted: 0,
        ...(options.onlyEnabled ? { status: "1" } : {}),
      },
      orderBy: { sort_order: "asc" },
    });
    return this.buildTree(depts, null);
  }

  async findPage(query: BaseQuery, where: any): Promise<PageResult<any>> {
    const pageNum = Math.max(1, query.pageNum || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 10));
    const skip = (pageNum - 1) * pageSize;

    const finalWhere: any = {
      ...where,
      tenant_id: query.tenantId,
      is_deleted: 0,
    };
    if (query.keyword) finalWhere.dept_name = { contains: query.keyword };
    if (query.status !== undefined) finalWhere.status = query.status;
    if (query.parentId) {
      finalWhere.parent_id = query.parentId;
    }
    const scopedWhere = this.mergeDataScope(finalWhere);
    const [list, total] = await Promise.all([
      this.model.findMany({
        where: scopedWhere,
        skip,
        take: pageSize,
        orderBy: { sort_order: "asc" },
      }),
      this.model.count({ where: scopedWhere }),
    ]);
    return {
      list,
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async softDelete(
    id: string,
    tenantId: string,
    userId?: string,
  ): Promise<any> {
    // 检查子部门
    const children = await this.model.count({
      where: { parent_id: id, tenant_id: tenantId, is_deleted: 0 },
    });
    if (children > 0) throw new AppError("存在子部门，无法删除", 400, 400);

    // 检查关联用户
    const userCount = await prisma.sys_user_dept.count({
      where: { dept_id: id, tenant_id: tenantId },
    });
    if (userCount > 0)
      throw new AppError("该部门下存在用户，无法删除", 400, 400);

    return super.softDelete(id, tenantId, userId);
  }

  /**
   * 检查部门编码唯一性（供 beforeCreate/beforeUpdate 调用）
   */
  async findByDeptCode(code: string, tenantId: string, excludeId?: string) {
    const where: any = {
      tenant_id: tenantId,
      dept_code: code,
      is_deleted: 0,
    };
    if (excludeId) where.dept_id = { not: excludeId };
    return this.model.findFirst({ where });
  }

  private buildTree(items: any[], parentId: string | null): any[] {
    return items
      .filter((item) => {
        if (parentId === null) {
          // 根节点：parent_id 为 null、undefined、空字符串或全零 UUID
          return (
            item.parent_id === null ||
            item.parent_id === undefined ||
            item.parent_id === "" ||
            item.parent_id === "00000000-0000-0000-0000-000000000000"
          );
        }
        return item.parent_id === parentId;
      })
      .map((item) => {
        const children = this.buildTree(items, item.dept_id);
        const node = {
          // @ts-ignore
          ...keysToCamelCase(item),
        };
        if (children.length > 0) {
          node.children = children;
        }
        return node;
      });
  }
  async updateDeptUsers(deptId: string, userIds: string[], tenantId: string) {
    if (userIds.length > 0) {
      const validCount = await prisma.sys_user.count({
        where: { user_id: { in: userIds }, tenant_id: tenantId, is_deleted: 0 },
      });
      if (validCount !== userIds.length) {
        throw new AppError("存在无效的用户ID", 400, 400);
      }
    }
    await prisma.$transaction([
      prisma.sys_user_dept.deleteMany({
        where: { dept_id: deptId, tenant_id: tenantId },
      }),
      prisma.sys_user_dept.createMany({
        data: userIds.map((userId) => ({
          user_id: userId,
          dept_id: deptId,
          tenant_id: tenantId,
          is_primary: 0,
        })),
      }),
    ]);
  }

  async findDeptUsers(deptId: string, tenantId: string) {
    const users = await prisma.sys_user_dept.findMany({
      where: { dept_id: deptId, tenant_id: tenantId },
      include: {
        user: {
          select: { user_id: true, username: true, real_name: true },
        },
      },
    });
    return users.map((u) => u.user);
  }
}
