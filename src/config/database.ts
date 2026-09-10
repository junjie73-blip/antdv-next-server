import { PrismaClient } from "@/generated/prisma/client.js";
import ws from "ws";
import { PrismaPg } from "@prisma/adapter-pg";
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};
function createPrismaClient() {
  // 判断是否为生产环境（或自定义 USE_NEON 变量）
  const isProduction = process.env.NODE_ENV === "production";
  const connectionString = process.env.DATABASE_URL;
  console.log("NODE_ENV:", isProduction);

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
  console.log(
    `Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`,
  );
});
export { prisma };
