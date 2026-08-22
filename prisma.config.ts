import { defineConfig } from "prisma/config";

// Vercel 构建时 prisma CLI 不会自动加载 .env，但环境变量已注入进程
const isMigration = process.argv.some((arg) => arg.includes("migrate"));

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url: isMigration
      ? process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
      : process.env.DATABASE_URL,
  },
});
