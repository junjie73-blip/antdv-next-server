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
    const perm = await prisma.permission.upsert({
      where: { tenantId_code: { tenantId, code } },
      update: {},
      create: {
        tenantId,
        code,
        name: `${resource} ${action}`,
        resource,
        action,
      },
    });
    permissionMap.set(code, perm.id);
  }

  // 2. 创建系统角色并绑定权限
  for (const [roleCode, perms] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { tenantId_code: { tenantId, code: roleCode } },
      update: {},
      create: {
        tenantId,
        name: roleCode,
        code: roleCode,
        isSystem: true,
      },
    });

    // 绑定权限
    for (const permCode of perms) {
      const permId = permissionMap.get(permCode);
      if (!permId) continue;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permId,
          },
        },
        update: {},
        create: { roleId: role.id, permissionId: permId },
      });
    }
  }
}
