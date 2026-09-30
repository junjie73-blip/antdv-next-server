import { logger } from "./logger.js";
import { env } from "./env.js";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

let consecutiveFailures = 0;
const DB_FAIL_THRESHOLD = 10;

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
    log: [
      // ✅ 订阅全部级别
      { emit: "event", level: "query" },
      { emit: "event", level: "info" },
      { emit: "event", level: "warn" },
      { emit: "event", level: "error" },
    ],
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
});

prisma.$on("warn", (e) => logger.warn({ message: e.message }, "prisma warn"));
prisma.$on("error", (e) =>
  logger.error({ message: e.message }, "prisma error"),
);

export async function withDbHealth<T>(fn: () => Promise<T>): Promise<T> {
  try {
    const result = await fn();
    consecutiveFailures = 0;
    return result;
  } catch (err) {
    consecutiveFailures++;
    if (consecutiveFailures >= DB_FAIL_THRESHOLD) {
      logger.fatal(
        { consecutiveFailures, err },
        "database consecutive failures",
      );
    }
    throw err;
  }
}
