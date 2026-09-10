import { prisma } from "@/config/database.js";

export class DataScopeRepository {
  /** 获取角色的数据范围配置 */
  async getRoleScope(roleId: string, tenantId: string) {
    const role = await prisma.sys_role.findFirst({
      where: { role_id: roleId, tenant_id: tenantId, is_deleted: 0 },
      select: { role_id: true, role_name: true, data_scope: true },
    });
    const depts = await prisma.sys_role_dept.findMany({
      where: { role_id: roleId, tenant_id: tenantId },
      select: { dept_id: true },
    });
    return role ? { ...role, deptIds: depts.map((d) => d.dept_id) } : null;
  }

  /** 更新角色数据范围 */
  async updateRoleScope(
    roleId: string,
    dataScope: string,
    deptIds: string[],
    tenantId: string,
  ) {
    await prisma.$transaction(async (tx) => {
      await tx.sys_role.update({
        where: { role_id: roleId },
        data: { data_scope: dataScope },
      });
      await tx.sys_role_dept.deleteMany({
        where: { role_id: roleId, tenant_id: tenantId },
      });
      if (dataScope === "2" && deptIds.length > 0) {
        await tx.sys_role_dept.createMany({
          data: deptIds.map((did) => ({
            role_id: roleId,
            dept_id: did,
            tenant_id: tenantId,
          })),
        });
      }
    });
  }

  /**
   * 根据用户 ID 计算可见的部门 ID 列表
   * 返回 null 表示不过滤（全部数据）
   */
  async getUserDataScope(
    userId: string,
    tenantId: string,
  ): Promise<string[] | null> {
    const userRoles = await prisma.sys_user_role.findMany({
      where: { user_id: userId, tenant_id: tenantId },
      include: { role: true },
    });
    const scopes = userRoles.map((r) => r.role?.data_scope || "1");
    if (scopes.includes("1")) return null; // 全部数据

    const deptIds = new Set<string>();
    for (let i = 0; i < userRoles.length; i++) {
      const ur = userRoles[i];
      const scope = ur.role?.data_scope;
      if (scope === "3" || scope === "4") {
        // 本部门/本部门及以下
        const userDepts = await prisma.sys_user_dept.findMany({
          where: { user_id: userId, tenant_id: tenantId },
          select: { dept_id: true },
        });
        if (scope === "3") {
          userDepts.forEach((ud) => deptIds.add(ud.dept_id));
        } else {
          // 本部门及以下：递归收集子部门
          for (const ud of userDepts) {
            const all = await collectChildDepts(ud.dept_id, tenantId);
            all.forEach((id) => deptIds.add(id));
          }
        }
      } else if (scope === "2") {
        // 自定义
        const customDepts = await prisma.sys_role_dept.findMany({
          where: { role_id: ur.role_id, tenant_id: tenantId },
          select: { dept_id: true },
        });
        customDepts.forEach((cd) => deptIds.add(cd.dept_id));
      }
      // scope === '5' 仅本人：由业务查询时用 created_by 过滤，不放入 deptIds
    }

    return Array.from(deptIds);
  }
}

async function collectChildDepts(
  deptId: string,
  tenantId: string,
): Promise<string[]> {
  const allDepts = await prisma.sys_dept.findMany({
    where: { tenant_id: tenantId, is_deleted: 0 },
    select: { dept_id: true, parent_id: true },
  });
  const result: string[] = [];
  const dfs = (id: string) => {
    result.push(id);
    allDepts.filter((d) => d.parent_id === id).forEach((d) => dfs(d.dept_id));
  };
  dfs(deptId);
  return result;
}
