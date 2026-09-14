import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client.js";
import { logger } from "@/core/logger/logger.js";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};
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
if (process.env.NODE_ENV !== "production") {
  delete globalForPrisma.prisma;
}
const prisma = createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

prisma.$on("query", (e) => {
  if (process.env.NODE_ENV !== "production") {
    logger.debug({ duration: e.duration, query: e.query }, "prisma query");
  }
});
export { prisma };
