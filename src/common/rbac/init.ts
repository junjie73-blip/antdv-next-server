import { prisma } from "@/config/database.js";
import {
  SYSTEM_ROLE,
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION,
} from "./constants.js";

export async function initTenantRbac(tenantId: string) {
  // 1. 创建系统权限
  const allPermissions = Object.values(PERMISSION).flatMap((p) =>
    Object.values(p),
  );
  const permissionMap = new Map<string, string>(); // code -> id

  for (const code of allPermissions) {
    const [resource, action] = code.split(":");
    const perm = await prisma.sys_permission.upsert({
      where: { tenant_id_perm_code: { tenant_id: tenantId, perm_code: code } },
      update: {},
      create: {
        tenant_id: tenantId,
        perm_code: code,
        perm_name: `${resource} ${action}`,
        resource_type: resource,
        action,
      },
    });
    permissionMap.set(code, perm.perm_id);
  }

  // 2. 创建系统角色并绑定权限
  for (const [roleCode, perms] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const role = await prisma.sys_role.upsert({
      where: { tenant_id_role_code: { tenant_id: tenantId, role_code: roleCode } },
      update: {},
      create: {
        tenant_id: tenantId,
        role_name: roleCode,
        role_code: roleCode,
      },
    });

    // 绑定权限
    for (const permCode of perms) {
      const permId = permissionMap.get(permCode);
      if (!permId) continue;
      await prisma.sys_role_permission.upsert({
        where: {
          role_id_perm_id: {
            role_id: role.role_id,
            perm_id: permId,
          },
        },
        update: {},
        create: { role_id: role.role_id, perm_id: permId, tenant_id: tenantId },
      });
    }
  }
}
