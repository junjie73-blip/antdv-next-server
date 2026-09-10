import { BaseRepository } from "@/core/base-repository.js";
import { prisma } from "@/config/database.js";
import { BaseQuery, PageResult } from "@/types/base-repository.js";
import { keysToCamelCase } from "@/common/utils/case-convert.js";
import { AppError } from "@/middleware/error-handler.js";
import XLSX from "xlsx";
export class RoleRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.sys_role;
  protected readonly primaryKey = "role_id";

  /**
   * 分页查询角色
   */
  async findPage(query: BaseQuery, where: any): Promise<PageResult<any>> {
    const pageNum = Math.max(1, query.pageNum || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 10));
    const skip = (pageNum - 1) * pageSize;

    const finalWhere: any = {
      ...where,
      tenant_id: query.tenantId,
      is_deleted: 0,
    };

    if (query.keyword) {
      finalWhere.OR = [
        { role_code: { contains: query.keyword } },
        { role_name: { contains: query.keyword } },
      ];
    }
    if (query.status !== undefined) {
      finalWhere.status = query.status;
    }

    const [list, total] = await Promise.all([
      this.model.findMany({
        where: finalWhere,
        skip,
        take: pageSize,
        orderBy: { sort_order: "asc" },
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

  /**
   * 获取角色详情（含关联的菜单ID、权限ID）
   */
  async findRoleDetail(roleId: string, tenantId: string) {
    return this.model.findFirst({
      where: { role_id: roleId, tenant_id: tenantId, is_deleted: 0 },
      include: {
        sys_role_menu: { select: { menu_id: true } },
        sys_role_permission: { select: { perm_id: true } },
      },
    });
  }

  /**
   * 检查角色编码唯一性（供 beforeCreate/beforeUpdate 调用）
   */
  async findByRoleCode(code: string, tenantId: string, excludeId?: string) {
    const where: any = {
      tenant_id: tenantId,
      role_code: code,
      is_deleted: 0,
    };
    if (excludeId) where.role_id = { not: excludeId };
    return this.model.findFirst({ where });
  }

  /**
   * 更新角色关联的菜单
   */
  async updateRoleMenus(roleId: string, menuIds: string[], tenantId: string) {
    await prisma.$transaction([
      prisma.sys_role_menu.deleteMany({
        where: { role_id: roleId, tenant_id: tenantId },
      }),
      prisma.sys_role_menu.createMany({
        data: menuIds.map((menuId) => ({
          role_id: roleId,
          menu_id: menuId,
          tenant_id: tenantId,
        })),
      }),
    ]);
  }

  /**
   * 更新角色关联的权限
   */
  async updateRolePermissions(
    roleId: string,
    permIds: string[],
    tenantId: string,
  ) {
    await prisma.$transaction([
      prisma.sys_role_permission.deleteMany({
        where: { role_id: roleId, tenant_id: tenantId },
      }),
      prisma.sys_role_permission.createMany({
        data: permIds.map((permId) => ({
          role_id: roleId,
          perm_id: permId,
          tenant_id: tenantId,
        })),
      }),
    ]);
  }

  /**
   * 更新角色关联的用户
   */
  async updateRoleUsers(roleId: string, userIds: string[], tenantId: string) {
    await prisma.$transaction([
      prisma.sys_user_role.deleteMany({
        where: { role_id: roleId, tenant_id: tenantId },
      }),
      prisma.sys_user_role.createMany({
        data: userIds.map((userId) => ({
          user_id: userId,
          role_id: roleId,
          tenant_id: tenantId,
        })),
      }),
    ]);
  }

  /**
   * 获取角色关联的用户列表
   */
  async findRoleUsers(roleId: string, tenantId: string) {
    const users = await prisma.sys_user_role.findMany({
      where: { role_id: roleId, tenant_id: tenantId },
      include: {
        user: {
          select: { user_id: true, username: true, real_name: true },
        },
      },
    });
    return users.map((u) => u.user);
  }
  async findAllMenus(tenantId: string) {
    return prisma.sys_menu.findMany({
      where: { tenant_id: tenantId, is_deleted: 0 },
      orderBy: { sort_order: "asc" },
    });
  }

  async getRoleMenuIds(roleId: string, tenantId: string) {
    const roleMenus = await prisma.sys_role_menu.findMany({
      where: { role_id: roleId, tenant_id: tenantId },
      select: { menu_id: true },
    });
    return roleMenus.map((rm) => rm.menu_id);
  }
  async exportRoles(where: any, tenantId: string): Promise<Buffer> {
    const finalWhere = { ...where, tenant_id: tenantId, is_deleted: 0 };
    const roles = await this.model.findMany({
      where: finalWhere,
      orderBy: { sort_order: "asc" },
    });

    const data = roles.map((r: any) => ({
      角色编码: r.role_code,
      角色名称: r.role_name,
      描述: r.description || "",
      排序: r.sort_order,
      状态: r.status === 1 ? "启用" : "禁用",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "角色数据");
    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  }
  async importRolesFromExcel(
    fileBuffer: Buffer,
    tenantId: string,
    userId?: string,
  ) {
    // 解析 Excel
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as any[];

    const successList: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;
      try {
        const roleCode = String(row["角色编码"] || "").trim();
        const roleName = String(row["角色名称"] || "").trim();
        const description = String(row["描述"] || "").trim() || undefined;
        const sortOrder = Number(row["排序"] || 0);
        const status = row["状态"] === "禁用" ? 0 : 1;

        if (!roleCode || !roleName) throw new Error("角色编码和名称不能为空");

        // 检查唯一性
        const exist = await this.findByRoleCode(roleCode, tenantId);
        if (exist) throw new Error(`角色编码 '${roleCode}' 已存在`);

        successList.push({
          role_code: roleCode,
          role_name: roleName,
          description,
          sort_order: sortOrder,
          status,
        });
      } catch (e: any) {
        errors.push(`第${rowNum}行：${e.message}`);
      }
    }

    let successCount = 0;
    if (successList.length > 0) {
      await this.model.createMany({
        data: successList.map((item) => ({
          ...item,
          tenant_id: tenantId,
          created_by: userId,
          updated_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
          is_deleted: 0,
        })),
      });
      successCount = successList.length;
    }

    return { successCount, failCount: errors.length, errors };
  }
  async findRoleMenuIds(roleId: string, tenantId: string): Promise<string[]> {
    const roleMenus = await prisma.sys_role_menu.findMany({
      where: { role_id: roleId, tenant_id: tenantId },
      select: { menu_id: true },
    });
    return roleMenus.map((rm) => rm.menu_id);
  }
}
