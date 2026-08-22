import "reflect-metadata";
import "dotenv/config";
import express, { Request, Response } from "express";
import path from "path";
import { prisma } from "@config/database.js";
import { redis } from "@config/redis.js";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { errorHandler } from "@common/middleware/error-handler.js";
import * as bodyParser from "body-parser";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "10mb" }));

// 启动时验证连接
async function healthCheck() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Neon PostgreSQL connected");
  } catch (e) {
    console.error("❌ Neon PostgreSQL failed", e);
  }

  try {
    await redis.ping();
    console.log("✅ Upstash Redis connected");
  } catch (e) {
    console.error("❌ Upstash Redis failed", e);
  }
}

healthCheck();
// 健康检查
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 全局错误处理
app.use(errorHandler);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
});
export default app;
