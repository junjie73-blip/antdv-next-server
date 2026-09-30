import { config } from "dotenv";
import { z } from "zod";

config();

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  SERVICE_NAME: z.string().default("auth-svc"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  GRPC_PORT: z.coerce.number().int().min(1).max(65535).default(50051),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().url(),

  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("3h"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("15h"),

  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  OTEL_SERVICE_NAME: z.string().optional(),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error"])
    .default("info"),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  DB_IDLE_TIMEOUT_MS: z.coerce.number().int().min(1).default(30000),
  DB_CONNECT_TIMEOUT_MS: z.coerce.number().int().min(1).default(30000),
  APP_NAME: z.string().default("SaaS Admin"),
  APP_VERSION: z.string().default("1.0.0"),
  SERVICE_REGISTRY: z.enum(["static", "consul"]).default("static"),
  CONSUL_HOST: z.string().default("localhost"),
  CONSUL_PORT: z.coerce.number().int().min(1).max(65535).default(8500),
  /** 健康检查间隔（秒），仅注册时用 */
  CONSUL_HEALTH_INTERVAL: z.string().default("10s"),
  /** 健康检查超时 */
  CONSUL_HEALTH_TIMEOUT: z.string().default("3s"),
  /** 连续失败多久后自动摘除（Consul 支持 5m/10s 等格式） */
  CONSUL_DEREGISTER_AFTER: z.string().default("30s"),
  SERVICE_HOST: z.string().default("localhost"),
  SERVICE_VERSION: z.string().default("1.0.0"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ 环境变量校验失败：");
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
