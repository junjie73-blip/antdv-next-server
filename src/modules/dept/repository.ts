import { BaseRepository } from "@/core/base/repository.js";
import { prisma } from "@/config/database.js";
import { BaseQuery, PageResult } from "@/types/base-repository.js";
import { keysToCamelCase } from "@/shared/utils/case-convert.js";
import { AppError } from "@/middleware/http/error-handler.js";

export class DeptRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.sys_dept;
  protected readonly primaryKey = "dept_id";

  async findPage(query: BaseQuery, where: any): Promise<PageResult<any>> {
    return this.paginate({ ...query, maxPageSize: 100 }, where, {
      defaultOrderBy: { sort_order: "asc" },
      extendWhere: ({ query }) => {
        const extra: Record<string, any> = {};
        if (query.deptName) extra.dept_name = { contains: query.deptName };
        if (query.status !== undefined) extra.status = query.status;
        if (query.parentId) extra.parent_id = query.parentId;
        return extra;
      },
    });
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
  async findAllForExport(tenantId: string) {
    const depts = await this.model.findMany({
      where: { tenant_id: tenantId, is_deleted: 0 },
      orderBy: [{ parent_id: "asc" }, { sort_order: "asc" }],
    });

    const idToCode = new Map<string, string>(
      depts.map((d: any) => [d.dept_id, d.dept_code]),
    );

    return depts.map((d: any) => ({
      ...d,
      parent_code: d.parent_id ? idToCode.get(d.parent_id) || "" : "",
    }));
  }

  async getCodeToIdMap(tenantId: string): Promise<Map<string, string>> {
    const rows = await this.model.findMany({
      where: { tenant_id: tenantId, is_deleted: 0 },
      select: { dept_id: true, dept_code: true },
    });
    return new Map(rows.map((r: any) => [r.dept_code, r.dept_id]));
  }

  async insertDept(data: any): Promise<string> {
    const record = await this.model.create({
      data: {
        tenant_id: data.tenantId,
        parent_id: data.parentId,
        dept_code: data.deptCode,
        dept_name: data.deptName,
        leader: data.leader || null,
        phone: data.phone || null,
        email: data.email || null,
        sort_order: data.sortOrder,
        status: data.status,
        created_by: data.userId,
        updated_by: data.userId,
        created_at: new Date(),
        updated_at: new Date(),
        is_deleted: 0,
      },
    });
    return (record as any).dept_id;
  }
  async findAllByTenant(
    tenantId: string,
    options: { onlyEnabled?: boolean } = {},
  ) {
    return this.model.findMany({
      where: {
        tenant_id: tenantId,
        is_deleted: 0,
        ...(options.onlyEnabled ? { status: "1" } : {}),
      },
      orderBy: { sort_order: "asc" },
    });
  }
}
