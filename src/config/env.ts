import { config } from "dotenv";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { z } from "zod";
// ========== 智能查找 .env 文件 ==========
function findEnvFile(): string | null {
  const candidates = [
    resolve(process.cwd(), ".env.development"),
    resolve(process.cwd(), ".env"),
  ];
  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  return null;
}

const envPath = findEnvFile();
if (!envPath) {
  console.error("❌ 找不到 .env 或 .env.development 文件");
  console.error("   当前工作目录:", process.cwd());
  console.error("   __dirname:", __dirname);
  throw new Error("环境变量文件缺失");
}

// 加载主 env 文件
config({ path: envPath, override: true });

// 如果加载的是 .env，再尝试覆盖 .env.development
if (!envPath.includes(".env.development")) {
  const devPath = envPath.replace(".env", ".env.development");
  if (existsSync(devPath)) {
    config({ path: devPath, override: true });
  }
}

// 手动解析兜底（处理引号等特殊情况）
const raw = readFileSync(envPath, "utf-8");
if (!process.env.DATABASE_URL) {
  raw.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eq = trimmed.indexOf("=");
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    process.env[key] = value;
  });
}

// ========== Vercel 变量自动映射 ==========
if (!process.env.DATABASE_URL && process.env.POSTGRES_URL) {
  process.env.DATABASE_URL = process.env.POSTGRES_URL;
}
if (!process.env.REDIS_URL && process.env.KV_REST_API_URL) {
  process.env.REDIS_URL = process.env.KV_REST_API_URL;
}

// ========== 校验 ==========
const isVercel = process.env.VERCEL === "1";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("3000"),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL 不能为空"),
  DATABASE_URL_UNPOOLED: z.string().optional(),
  REDIS_URL: z.string().optional(),
  REDIS_TOKEN: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: isVercel ? z.string().min(1) : z.string().optional(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET 至少32位"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET 至少32位"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
  RATE_LIMIT_WINDOW_MS: z.string().default("60000"),
  RATE_LIMIT_MAX: z.string().default("100"),
  UPLOAD_MAX_FILE_SIZE: z.string().default("104857600"),
  UPLOAD_MAX_CHUNK_SIZE: z.string().default("5242880"),
  MFA_ISSUER: z.string().default("AntdvSaaS"),
  OAUTH_GOOGLE_CLIENT_ID: z.string().optional(),
  OAUTH_GOOGLE_CLIENT_SECRET: z.string().optional(),
  OAUTH_GITHUB_CLIENT_ID: z.string().optional(),
  OAUTH_GITHUB_CLIENT_SECRET: z.string().optional(),
});

export const env = envSchema.parse(process.env);
