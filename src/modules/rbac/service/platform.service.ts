import { prisma } from "@/config/database.js";

/**
 * 判断用户是否是平台超管
 * ⭐ 不再依赖租户编码约定，改用 sys_tenant.is_platform 字段
 */
export async function isPlatformAdmin(
  userId: string,
  tenantId: string,
): Promise<boolean> {
  const tenant = await prisma.sys_tenant.findUnique({
    where: { tenant_id: tenantId },
  });
  if (!(tenant as any)?.is_platform) return false;

  const userRoles = await prisma.sys_user_role.findMany({
    where: { user_id: userId, tenant_id: tenantId },
    include: { role: { select: { role_code: true } } },
  });
  return userRoles.some((ur) => ur.role?.role_code === "SUPER_ADMIN");
}
