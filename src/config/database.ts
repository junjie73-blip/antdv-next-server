import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client.js";
import { logger } from "@/core/logger/logger.js";
import { dbQueryDuration } from "@/core/metrics/index.js";
import { sendAlert } from "@/core/alert/index.js";
const SLOW_QUERY_MS = 5000;
const DB_FAIL_THRESHOLD = 10;

let consecutiveFailures = 0;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  const adapter = new PrismaPg({ connectionString });
  // 本地开发：使用标准 Prisma Client（依赖 pg）
  return new PrismaClient({
    adapter,
    transactionOptions: {
      maxWait: 5000,
      timeout: 15000,
    },
    log: [
      {
        emit: "event",
        level: "query",
      },
    ],
  });
}
const prisma = createPrismaClient();

prisma.$on("query", (e) => {
  if (process.env.NODE_ENV !== "production") {
    logger.debug(
      { duration: e.duration, query: e.query.slice(0, 200) },
      "prisma query",
    );
  }

  // 慢查询告警
  if (e.duration > SLOW_QUERY_MS) {
    void sendAlert({
      level: "warning",
      title: "slow_query",
      message: `慢查询 ${e.duration}ms`,
      source: "database",
      data: {
        duration: e.duration,
        query: e.query.slice(0, 500),
      },
    });
  }
});
const originalError = prisma.$on.bind(prisma);
// 或在 error handler 里做：
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
export { prisma };
