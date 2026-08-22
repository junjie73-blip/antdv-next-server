import "dotenv/config";
import { defineConfig } from "prisma/config";

// Vercel 用 POSTGRES_URL_*, 本地用 DATABASE_URL_*
// migrate deploy 必须用 NON_POOLING（直连，不支持 pgbouncer）
const url =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "Database URL is required. Set POSTGRES_URL_NON_POOLING or DATABASE_URL.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url,
  },
});
