import { prisma } from "@/config/database.js";

const LOCK_ID = 987654321;

/**
 * 事务级 advisory lock，事务结束自动释放，不会跨连接泄漏。
 * @returns 抢到锁则返回 fn 结果，否则返回 null
 */
export async function withPgLock<T>(fn: () => Promise<T>): Promise<T | null> {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRawUnsafe<{ locked: boolean }[]>(
      `SELECT pg_try_advisory_xact_lock(${LOCK_ID}) AS locked`,
    );
    if (!rows[0]?.locked) return null;
    return fn();
  });
}
