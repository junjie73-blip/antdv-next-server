import { redis } from "@/config/redis.js";

const TTL = 300; // 5 分钟

function key(tenantId: string, userId: string, type: "perms" | "roles") {
  return `rbac:${type}:${tenantId}:${userId}`;
}

export const rbacCache = {
  async getPermissions(
    tenantId: string,
    userId: string,
  ): Promise<string[] | null> {
    const data = await redis.get(key(tenantId, userId, "perms"));
    return data ? (JSON.parse(data as string) as string[]) : null;
  },

  async setPermissions(
    tenantId: string,
    userId: string,
    permissions: string[],
  ) {
    await redis.set(
      key(tenantId, userId, "perms"),
      JSON.stringify(permissions),
      { ex: TTL },
    );
  },

  async getRoles(tenantId: string, userId: string): Promise<string[] | null> {
    const data = await redis.get(key(tenantId, userId, "roles"));
    return data ? (JSON.parse(data as string) as string[]) : null;
  },

  async setRoles(tenantId: string, userId: string, roles: string[]) {
    await redis.set(key(tenantId, userId, "roles"), JSON.stringify(roles), {
      ex: TTL,
    });
  },

  async invalidate(tenantId: string, userId: string) {
    await redis.del(key(tenantId, userId, "perms"));
    await redis.del(key(tenantId, userId, "roles"));
  },

  async invalidateTenant(tenantId: string) {
    // 扫描并删除该租户下所有缓存（生产环境建议用 Redis Keyspace 或 Hash 结构优化）
    const permsKeys = await redis.keys(`rbac:perms:${tenantId}:*`);
    const rolesKeys = await redis.keys(`rbac:roles:${tenantId}:*`);
    if (permsKeys.length) await redis.del(...permsKeys);
    if (rolesKeys.length) await redis.del(...rolesKeys);
  },
};
