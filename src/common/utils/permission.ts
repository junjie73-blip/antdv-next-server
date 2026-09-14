import { prisma } from "@/config/database.js";
import { getUserPermissions } from "../rbac/index.js";

/**
 * 检查用户是否拥有指定权限（任一匹配即可）
 * @param user - 当前用户对象（至少包含 userId, tenantId）
 * @param permissions - 需要检查的权限编码数组，如 ['user:list', 'user:create']
 * @returns boolean
 */
export async function checkUserPermissions(
  user: { userId: string; tenantId: string },
  permissions: string[],
): Promise<boolean> {
  if (!user || !permissions || permissions.length === 0) return false;
  const perms = await getUserPermissions(user.userId, user.tenantId);
  return perms.includes("*") || permissions.some((p) => perms.includes(p));
}
