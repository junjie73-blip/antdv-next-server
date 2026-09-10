import { redis } from "@/config/redis.js";
import { prisma } from "@/config/database.js";

export class OnlineRepository {
  /** 扫描在线会话（Redis 键 access:*） */
  async list(tenantId: string) {
    const keys: string[] = [];
    let cursor = "0";
    do {
      const [next, batch] = await redis.scan(cursor, {
        match: "access:*",
        count: 100,
      });
      cursor = next;
      keys.push(...batch);
    } while (cursor !== "0");

    if (keys.length === 0) return [];

    // 从 key 里解析 userId
    const userIds = keys.map((k) => k.replace("access:", "")).filter(Boolean);

    // 批量查用户信息
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

    // TTL 作为会话剩余时间参考
    const result = await Promise.all(
      userIds.map(async (uid) => {
        const u = userMap.get(uid);
        if (!u) return null;
        const ttl = await redis.ttl(`access:${uid}`);
        return {
          userId: u.user_id,
          username: u.username,
          realName: u.real_name,
          ip: u.last_login_ip,
          loginTime: u.last_login_time,
          ttl, // 剩余秒数
        };
      }),
    );

    return result.filter(Boolean);
  }

  /** 强制下线 */
  async kick(userId: string) {
    await redis.del(`access:${userId}`);
    await redis.del(`refresh:${userId}`);
  }

  /** 全部下线 */
  async kickAll(tenantId: string) {
    const users = await prisma.sys_user.findMany({
      where: { tenant_id: tenantId, is_deleted: 0 },
      select: { user_id: true },
    });
    const keys = users.map((u) => `access:${u.user_id}`);
    if (keys.length > 0) await redis.del(...keys);
    await Promise.all(users.map((u) => redis.del(`refresh:${u.user_id}`)));
  }
}
