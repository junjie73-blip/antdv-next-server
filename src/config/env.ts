import { config } from "dotenv";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { z } from "zod";

function findEnvFile(): string | null {
  const candidates = [
    resolve(process.cwd(), ".env.development"),
    resolve(process.cwd(), ".env"),
  ];
  for (const p of candidates) if (existsSync(p)) return p;
  return null;
}

const envPath = findEnvFile();
if (!envPath) {
  console.error("❌ 找不到 .env 或 .env.development 文件");
  console.error("   当前工作目录:", process.cwd());
  throw new Error("环境变量文件缺失");
}

config({ path: envPath, override: true });

if (!envPath.includes(".env.development")) {
  const devPath = envPath.replace(".env", ".env.development");
  if (existsSync(devPath)) config({ path: devPath, override: true });
}

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

const isVercel = process.env.VERCEL === "1";

/** 布尔字符串 → boolean（z.coerce.boolean 有 "false" → true 的坑） */
const boolStr = (def: "true" | "false") =>
  z
    .enum(["true", "false"])
    .default(def)
    .transform((v) => v === "true");

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("3000"),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL 不能为空"),
  DATABASE_URL_UNPOOLED: z.string().optional(),
  DB_POOL_MAX: z.string().default("20"),
  DB_IDLE_TIMEOUT_MS: z.string().default("30000"),
  DB_CONNECT_TIMEOUT_MS: z.string().default("5000"),
  REDIS_URL: z.string().url().min(1, "REDIS_URL 不能为空"),
  REDIS_TOKEN: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: isVercel ? z.string().min(1) : z.string().optional(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET 至少32位"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET 至少32位"),
  JWT_EXPIRES_IN: z.string().default("3h"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("15h"),
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
  ENCRYPTION_KEY: z.string().min(32, "ENCRYPTION_KEY 至少32位"),
  BCRYPT_SALT_ROUNDS: z.string().default("12"),
  FRONTEND_URL: z.string().default("http://localhost:5680"),
  SERVERLESS: z.string().default("0"),
  ENABLE_DOCS: z.string().default("0"),
  BODY_LIMIT: z.string().default("10mb"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  SYSTEM_NAME: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  METRICS_WHITELIST: z.string().optional(),
  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  MINIO_USE_SSL: boolStr("false"),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_REGION: z.string().default("us-east-1"),
  MINIO_BUCKET: z.string().min(1),
  MINIO_ARCHIVE_BUCKET: z.string().optional(),
  MINIO_PUBLIC_URL: z.string().optional(),
  UPLOAD_MAX_BYTES_PER_HOUR: z.string().optional().default("5000000000"),
  UPLOAD_ID_RATE_PER_SEC: z.string().optional().default("200"),
  UPLOAD_ROOT: z.string().optional(),
  AUDIT_LOG_RETENTION_DAYS: z.string().optional().default("180"),
  LOGIN_LOG_RETENTION_DAYS: z.string().optional().default("90"),
  NOTICE_SEND_LOG_RETENTION_DAYS: z.string().optional().default("90"),
  JOB_LOG_RETENTION_DAYS: z.string().optional().default("60"),
  MINIO_ENABLED: boolStr("true"),
  ALLOW_UNAUTH_TENANT_HEADER: boolStr("false"),
});

export const env = envSchema.parse(process.env);
