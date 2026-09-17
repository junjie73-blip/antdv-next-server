import { BaseRepository } from "@/core/base/repository.js";
import { prisma } from "@/config/database.js";
import { BaseQuery, PageResult } from "@/types/base-repository.js";
import { AppError } from "@/core/errors.js";
import * as XLSX from "xlsx";
export type RelationDelegate = {
  findMany: (args: any) => Promise<any[]>;
  deleteMany: (args: any) => Promise<any>;
  createMany: (args: any) => Promise<any>;
};

export interface SyncResult {
  added: number;
  removed: number;
  kept: number;
  total: number;
}

export class RoleRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.sys_role;
  protected readonly primaryKey = "role_id";

  // ============================================================
  // 分页
  // ============================================================
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

    // 数据权限合并
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

  // ============================================================
  // 详情（含菜单 / 权限 ID）
  // ============================================================
  async findRoleDetail(roleId: string, tenantId: string) {
    return this.model.findFirst({
      where: { role_id: roleId, tenant_id: tenantId, is_deleted: 0 },
      include: {
        sys_role_menu: { select: { menu_id: true } },
        sys_role_permission: { select: { perm_id: true } },
      },
    });
  }

  // ============================================================
  // 唯一性检查
  // ============================================================
  async findByRoleCode(code: string, tenantId: string, excludeId?: string) {
    const where: any = {
      tenant_id: tenantId,
      role_code: code,
      is_deleted: 0,
    };
    if (excludeId) where.role_id = { not: excludeId };
    return this.model.findFirst({ where });
  }

  // ============================================================
  // 关联更新（含 ID 归属校验）
  // ============================================================

  private async assertRoleExists(roleId: string, tenantId: string) {
    const role = await this.model.findFirst({
      where: { role_id: roleId, tenant_id: tenantId, is_deleted: 0 },
      select: { role_id: true },
    });
    if (!role) throw new AppError("角色不存在", 404001, 404);
  }

  /** 校验一批 ID 是否全部属于本租户（用于 menu/perm/user） */
  private async assertOwnership(
    table: "sys_menu" | "sys_permission" | "sys_user" | "sys_dept",
    idField: "menu_id" | "perm_id" | "user_id" | "dept_id",
    ids: string[],
    tenantId: string,
  ) {
    if (ids.length === 0) return;
    // 用唯一性去重后再比对数量
    const uniqueIds = [...new Set(ids)];
    const rows = await (prisma as any)[table].findMany({
      where: {
        [idField]: { in: uniqueIds },
        tenant_id: tenantId,
        is_deleted: 0,
      },
      select: { [idField]: true },
    });
    if (rows.length !== uniqueIds.length) {
      throw new AppError(`存在无效的 ${idField}`, 400001, 400);
    }
  }

  async updateRoleMenus(
    roleId: string,
    menuIds: string[],
    tenantId: string,
  ): Promise<SyncResult> {
    await this.assertRoleExists(roleId, tenantId);

    // ⭐ 去重，避免重复入参导致差异计算错误
    const uniqueMenuIds = [...new Set(menuIds)];
    await this.assertOwnership("sys_menu", "menu_id", uniqueMenuIds, tenantId);

    return syncRoleRelation(
      prisma.sys_role_menu as unknown as RelationDelegate,
      roleId,
      tenantId,
      "menu_id",
      uniqueMenuIds,
    );
  }

  async updateRolePermissions(
    roleId: string,
    permIds: string[],
    tenantId: string,
  ): Promise<SyncResult> {
    await this.assertRoleExists(roleId, tenantId);

    const uniquePermIds = [...new Set(permIds)];
    await this.assertOwnership(
      "sys_permission",
      "perm_id",
      uniquePermIds,
      tenantId,
    );

    return syncRoleRelation(
      prisma.sys_role_permission as unknown as RelationDelegate,
      roleId,
      tenantId,
      "perm_id",
      uniquePermIds,
    );
  }

  async updateRoleUsers(roleId: string, tenantId: string, userIds: string[]) {
    await this.assertRoleExists(roleId, tenantId);
    await this.assertOwnership("sys_user", "user_id", userIds, tenantId);

    const current = await prisma.sys_user_role.findMany({
      where: { role_id: roleId, tenant_id: tenantId },
      select: { user_id: true },
    });
    const currentSet = new Set(current.map((r) => r.user_id));
    const nextSet = new Set(userIds);

    const toAdd = userIds.filter((id) => !currentSet.has(id));
    const toRemove = [...currentSet].filter((id) => !nextSet.has(id));

    await prisma.$transaction([
      ...(toRemove.length > 0
        ? [
            prisma.sys_user_role.deleteMany({
              where: {
                role_id: roleId,
                tenant_id: tenantId,
                user_id: { in: toRemove },
              },
            }),
          ]
        : []),
      ...(toAdd.length > 0
        ? [
            prisma.sys_user_role.createMany({
              data: toAdd.map((userId) => ({
                user_id: userId,
                role_id: roleId,
                tenant_id: tenantId,
              })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);
  }
  // ============================================================
  // 查询关联
  // ============================================================
  async findRoleUsers(roleId: string, tenantId: string) {
    const rows = await prisma.sys_user_role.findMany({
      where: { role_id: roleId, tenant_id: tenantId },
      include: {
        user: {
          select: { user_id: true, username: true, real_name: true },
        },
      },
    });
    return rows
      .map((r) => r.user)
      .filter(Boolean)
      .map((u) => u.user_id);
  }

  /** 角色已关联的菜单 ID 列表（唯一实现） */
  async findRoleMenuIds(roleId: string, tenantId: string): Promise<string[]> {
    const rows = await prisma.sys_role_menu.findMany({
      where: { role_id: roleId, tenant_id: tenantId },
      select: { menu_id: true },
    });
    return rows.map((r) => r.menu_id);
  }

  // ============================================================
  // 导出
  // ============================================================
  async exportRoles(where: any, tenantId: string): Promise<Buffer> {
    const finalWhere = { ...where, tenant_id: tenantId, is_deleted: 0 };
    const scopedWhere = this.mergeDataScope(finalWhere);
    const roles = await this.model.findMany({
      where: scopedWhere,
      orderBy: { sort_order: "asc" },
    });

    const data = roles.map((r: any) => ({
      角色编码: r.role_code,
      角色名称: r.role_name,
      描述: r.description || "",
      排序: r.sort_order,
      状态: r.status === "1" ? "启用" : "禁用",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "角色数据");
    return XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    }) as Buffer;
  }

  // ============================================================
  // 导入
  // ============================================================
  async importRolesFromExcel(
    fileBuffer: Buffer,
    tenantId: string,
    userId?: string,
  ) {
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new AppError("Excel 文件为空", 400001, 400);
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
        const status = row["状态"] === "禁用" ? "0" : "1";

        if (!roleCode || !roleName) throw new Error("角色编码和名称不能为空");

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
  /**
   * 更新角色的数据权限部门
   * 注意：只改 sys_role_dept 关联，不改 data_scope。
   *       data_scope 由 RoleController.update 通过 dataScope 字段处理。
   */
  async updateRoleDepts(roleId: string, deptIds: string[], tenantId: string) {
    await this.assertRoleExists(roleId, tenantId);
    await this.assertOwnership("sys_dept", "dept_id", deptIds, tenantId);

    await prisma.$transaction([
      prisma.sys_role_dept.deleteMany({
        where: { role_id: roleId, tenant_id: tenantId },
      }),
      ...(deptIds.length > 0
        ? [
            prisma.sys_role_dept.createMany({
              data: deptIds.map((deptId) => ({
                role_id: roleId,
                dept_id: deptId,
                tenant_id: tenantId,
              })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);
  }

  /** 角色已关联的数据权限部门 ID 列表 */
  async findRoleDeptIds(roleId: string, tenantId: string): Promise<string[]> {
    const rows = await prisma.sys_role_dept.findMany({
      where: { role_id: roleId, tenant_id: tenantId },
      select: { dept_id: true },
    });
    return rows.map((r) => r.dept_id);
  }
  async countUsersByRole(roleId: string, tenantId: string): Promise<number> {
    return prisma.sys_user_role.count({
      where: { role_id: roleId, tenant_id: tenantId },
    });
  }
  async options(tenantId: string) {
    const roles = await this.model.findMany({
      where: { tenant_id: tenantId, is_deleted: 0 },
      orderBy: { sort_order: "asc" },
    });
    return roles.map((r) => ({
      label: r.role_name,
      value: r.role_id,
    }));
  }
  /** 角色已关联的权限 ID 列表 */
  async findRolePermIds(roleId: string, tenantId: string): Promise<string[]> {
    const rows = await prisma.sys_role_permission.findMany({
      where: { role_id: roleId, tenant_id: tenantId },
      select: { perm_id: true },
    });
    return rows.map((r) => r.perm_id);
  }
}
/**
 * 差异同步角色关联表
 * @param delegate   Prisma 模型委托，如 prisma.sys_role_menu
 * @param roleId     角色 id
 * @param tenantId   租户 id
 * @param idField    关联目标字段名，如 "menu_id" / "perm_id"
 * @param nextIds    目标关联 id 列表（已去重、已校验归属）
 */
async function syncRoleRelation(
  delegate: RelationDelegate,
  roleId: string,
  tenantId: string,
  idField: string,
  nextIds: string[],
): Promise<SyncResult> {
  // 1) 查当前关联
  const current = await delegate.findMany({
    where: { role_id: roleId, tenant_id: tenantId },
    select: { [idField]: true },
  });
  const currentSet = new Set<string>(current.map((r) => r[idField]));
  const nextSet = new Set(nextIds);

  // 2) 差异计算
  const toAdd = nextIds.filter((id) => !currentSet.has(id));
  const toRemove = [...currentSet].filter((id) => !nextSet.has(id));
  const kept = nextIds.length - toAdd.length;

  // 3) 只写差异部分
  const ops: any[] = [];
  if (toRemove.length > 0) {
    ops.push(
      delegate.deleteMany({
        where: {
          role_id: roleId,
          tenant_id: tenantId,
          [idField]: { in: toRemove },
        },
      }),
    );
  }
  if (toAdd.length > 0) {
    ops.push(
      delegate.createMany({
        data: toAdd.map((id) => ({
          role_id: roleId,
          tenant_id: tenantId,
          [idField]: id,
        })),
        skipDuplicates: true,
      }),
    );
  }
  if (ops.length > 0) {
    await prisma.$transaction(ops);
  }

  return {
    added: toAdd.length,
    removed: toRemove.length,
    kept,
    total: nextIds.length,
  };
}
