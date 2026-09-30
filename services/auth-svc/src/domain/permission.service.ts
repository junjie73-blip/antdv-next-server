import { redis } from "../config/redis.js";
import { RoleRepository } from "../repository/role.repository.js";
import { logger } from "../config/logger.js";

const PERM_CACHE_TTL = 300;
const repo = new RoleRepository();

export class PermissionService {
  /** 获取用户权限码（带缓存） */
  async getUserPermissions(
    userId: string,
    tenantId: string,
  ): Promise<string[]> {
    const cacheKey = `rbac:perms:${tenantId}:${userId}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached !== null) return JSON.parse(cached) as string[];
    } catch (err) {
      logger.warn({ err }, "[perm] redis get failed");
    }

    const roleIds = await repo.findUserRoleIds(userId, tenantId);
    if (roleIds.length === 0) {
      await this.setCache(cacheKey, []);
      return [];
    }

    const perms = await repo.findPermCodesByRoleIds(roleIds, tenantId);
    const unique = [...new Set(perms)];
    await this.setCache(cacheKey, unique);
    return unique;
  }

  /** 检查单个权限 */
  async checkPermission(
    userId: string,
    tenantId: string,
    requiredPerm: string,
  ): Promise<boolean> {
    const perms = await this.getUserPermissions(userId, tenantId);
    return perms.includes("*") || perms.includes(requiredPerm);
  }

  /** 失效缓存 */
  async invalidate(userId: string, tenantId: string): Promise<void> {
    await redis.del(`rbac:perms:${tenantId}:${userId}`).catch(() => {});
  }

  private async setCache(key: string, value: string[]): Promise<void> {
    try {
      await redis.setex(key, PERM_CACHE_TTL, JSON.stringify(value));
    } catch {}
  }
}

export const permissionService = new PermissionService();
