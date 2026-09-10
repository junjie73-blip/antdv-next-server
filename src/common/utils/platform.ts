import { prisma } from "@/config/database.js";

/**
 * 判断用户是否是平台超管
 */
export async function isPlatformAdmin(
  userId: string,
  tenantId: string,
): Promise<boolean> {
  // 方式 1：通过租户编码
  const tenant = await prisma.sys_tenant.findUnique({
    where: { tenant_id: tenantId },
    select: { tenant_code: true },
  });
  if (!tenant?.tenant_code?.startsWith("__PLATFORM__")) return false;

  // 再校验是否有超管角色（可选）
  const userRoles = await prisma.sys_user_role.findMany({
    where: { user_id: userId, tenant_id: tenantId },
    include: { role: { select: { role_code: true } } },
  });
  return userRoles.some((ur) => ur.role?.role_code === "SUPER_ADMIN");
}
