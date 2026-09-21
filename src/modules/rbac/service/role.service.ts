import { prisma } from "@/config/database.js";
import { invalidateUserCache } from "./permission.service.js";

export async function assignRoleToUser(
  userId: string,
  roleId: string,
  tenantId: string,
): Promise<void> {
  await prisma.sys_user_role.upsert({
    where: { user_id_role_id: { user_id: userId, role_id: roleId } },
    update: {},
    create: { user_id: userId, role_id: roleId, tenant_id: tenantId },
  });
  await invalidateUserCache(userId, tenantId);
}

export async function removeRoleFromUser(
  userId: string,
  roleId: string,
  tenantId: string,
): Promise<void> {
  await prisma.sys_user_role.deleteMany({
    where: { user_id: userId, role_id: roleId, tenant_id: tenantId },
  });
  await invalidateUserCache(userId, tenantId);
}
