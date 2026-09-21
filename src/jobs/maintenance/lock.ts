import { prisma } from "@/config/database.js";

const LOCK_ID = 987654321; // 随便一个常量，全局唯一

export async function withPgLock<T>(fn: () => Promise<T>): Promise<T | null> {
  const [{ locked }] = await prisma.$queryRawUnsafe<{ locked: boolean }[]>(
    `SELECT pg_try_advisory_lock(${LOCK_ID}) AS locked`,
  );
  if (!locked) return null;

  try {
    return await fn();
  } finally {
    await prisma.$queryRawUnsafe(`SELECT pg_advisory_unlock(${LOCK_ID})`);
  }
}
