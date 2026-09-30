import { prisma } from "@/config/database.js";
import { redis } from "@/config/index.js";
import { scanAll } from "@/core/index.js";

export class OnlineRepository {
  async list(tenantId: string) {
    const keys: string[] = [];
    let cursor = "0";
    do {
      const [next, batch] = await redis.scan(
        cursor,
        "MATCH",
        `access:${tenantId}:*:*`,
        "COUNT",
        100,
      );
      cursor = next;
      keys.push(...batch);
    } while (cursor !== "0");

    if (keys.length === 0) return [];

    const parsed = keys
      .map((k) => {
        const [, tId, uid, deviceId] = k.split(":");
        return { fullKey: k, tenantId: tId, userId: uid, deviceId };
      })
      .filter((p) => p.tenantId === tenantId && p.userId && p.deviceId);

    const userIds = [...new Set(parsed.map((p) => p.userId))];
    const users = await prisma.sys_user.findMany({
      where: { user_id: { in: userIds }, tenant_id: tenantId, is_deleted: 0 },
      select: {
        user_id: true,
        username: true,
        real_name: true,
        last_login_ip: true,
        last_login_time: true,
      },
    });
    const userMap = new Map(users.map((u) => [u.user_id, u]));

    // ⭐ 以 session 为单位返回（同一用户多设备各一行）
    const rows = await Promise.all(
      parsed.map(async (p) => {
        const u = userMap.get(p.userId);
        if (!u) return null;
        const ttl = await redis.ttl(p.fullKey);
        if (ttl <= 0) return null; // 已过期
        return {
          userId: u.user_id,
          username: u.username,
          realName: u.real_name,
          deviceId: p.deviceId,
          ip: u.last_login_ip,
          loginTime: u.last_login_time,
          ttl,
        };
      }),
    );
    return rows.filter((r): r is NonNullable<typeof r> => r !== null);
  }

  async kickAll(tenantId: string) {
    const accessKeys = await scanAll(`access:${tenantId}:*`);
    const refreshKeys = await scanAll(`refresh:${tenantId}:*`);
    const all = [...accessKeys, ...refreshKeys];
    if (all.length === 0) return;
    // ✅ 分块删除，避免参数上限
    const { delChunked } = await import("@/core/cache/redis-client.js");
    await delChunked(all);
  }
}
