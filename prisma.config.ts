import "dotenv/config";
import { defineConfig } from "prisma/config";

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
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
