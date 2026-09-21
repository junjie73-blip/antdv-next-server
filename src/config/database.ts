import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client.js";
import { logger } from "@/platform/logger/logger.js";
import { sendAlert } from "@/platform/alert/index.js";
import { env } from "./env.js";

const SLOW_QUERY_MS = 500;
const DB_FAIL_THRESHOLD = 10;

let consecutiveFailures = 0;

function createPrismaClient() {
  const connectionString = env.DATABASE_URL;
  const adapter = new PrismaPg({
    connectionString,
    max: Number(env.DB_POOL_MAX),
    idleTimeoutMillis: Number(env.DB_IDLE_TIMEOUT_MS),
    connectionTimeoutMillis: Number(env.DB_CONNECT_TIMEOUT_MS),
  });

  return new PrismaClient({
    adapter,
    transactionOptions: { maxWait: 5000, timeout: 15000 },
    log: [{ emit: "event", level: "query" }],
  });
}

export const prisma = createPrismaClient();

prisma.$on("query", (e) => {
  if (env.NODE_ENV !== "production") {
    logger.debug(
      { duration: e.duration, query: e.query.slice(0, 200) },
      "prisma query",
    );
  }
  if (e.duration > SLOW_QUERY_MS) {
    void sendAlert({
      level: "warning",
      title: "slow_query",
      message: `慢查询 ${e.duration}ms`,
      source: "database",
      data: { duration: e.duration, query: e.query.slice(0, 500) },
    });
  }
});

export async function withDbHealth<T>(fn: () => Promise<T>): Promise<T> {
  try {
    const result = await fn();
    consecutiveFailures = 0;
    return result;
  } catch (err) {
    consecutiveFailures++;
    if (consecutiveFailures >= DB_FAIL_THRESHOLD) {
      void sendAlert({
        level: "critical",
        title: "database_consecutive_failures",
        message: `数据库连续失败 ${consecutiveFailures} 次`,
        source: "database",
        data: { error: String((err as Error)?.message) },
      });
    }
    throw err;
  }
}
