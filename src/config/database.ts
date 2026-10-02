import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client.js";
import { logger } from "@/platform/logger/logger.js";
import { sendAlert } from "@/platform/alert/index.js";
import { env } from "./env.js";
import {
  dbQueryDuration,
  dbSlowQueryTotal,
  extractOperationType,
} from "@/platform/metrics/index.js";
import { trace } from "@opentelemetry/api";
import { getDataScope } from "@/core/index.js";
import { slowQueryCollector } from "@/modules/monitor/slow-query/index.js";
import { attachDbPoolMetrics } from "@/platform/metrics/pool-collector.js";
const SLOW_QUERY_MS = 500;
const DB_FAIL_THRESHOLD = 10;

let consecutiveFailures = 0;

function createPrismaClient() {
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: Number(env.DB_POOL_MAX),
    idleTimeoutMillis: Number(env.DB_IDLE_TIMEOUT_MS),
    connectionTimeoutMillis: Number(env.DB_CONNECT_TIMEOUT_MS),
  });
  attachDbPoolMetrics(pool);
  const adapter = new PrismaPg(pool);

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

/* ============================================================
 * query：开发环境 debug，慢查询告警
 * ============================================================ */
prisma.$on("query", (e) => {
  if (env.NODE_ENV !== "production") {
    logger.debug(
      { duration: e.duration, query: e.query.slice(0, 200) },
      "prisma query",
    );
  }
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttribute("db.query", e.query.slice(0, 200));
    span.setAttribute("db.duration_ms", e.duration);
  }
  const op = extractOperationType(e.query);
  dbQueryDuration.observe({ operation: op }, e.duration / 1000);
  if (e.duration >= SLOW_QUERY_MS) {
    dbSlowQueryTotal.inc({ operation: op });

    // 从 ALS 取当前请求的 tenantId（可能为 null）
    let tenantId: string | undefined;
    try {
      tenantId = getDataScope().tenantId;
    } catch {
      // 未在请求上下文（如定时任务/启动阶段），允许为空
      tenantId = undefined;
    }

    slowQueryCollector.record({
      sql: e.query,
      durationMs: e.duration,
      tenantId: tenantId ?? null,
    });

    // 3. 原有告警逻辑保留（可降低阈值，或不发）
    void sendAlert({
      level: "warning",
      title: "slow_query",
      message: `慢查询 ${e.duration}ms [${op}]`,
      source: "database",
      data: { duration: e.duration, query: e.query.slice(0, 500) },
    });
  }
});

/* ============================================================
 * info：Prisma 内部信息（一般仅 debug）
 * ============================================================ */
prisma.$on("info", (e) => {
  if (env.NODE_ENV !== "production") {
    logger.debug({ message: e.message }, "prisma info");
  }
});

/* ============================================================
 * warn：Prisma 层警告（例如连接即将超时）
 * ============================================================ */
prisma.$on("warn", (e) => {
  logger.warn({ message: e.message }, "prisma warn");
});

/* ============================================================
 * error：Prisma 层错误（连接失败、超时）
 * ============================================================ */
prisma.$on("error", (e) => {
  logger.error({ message: e.message }, "prisma error");
  void sendAlert({
    level: "error",
    title: "prisma_error",
    message: "Prisma 层错误",
    source: "database",
    data: { message: e.message.slice(0, 500) },
  });
});

/* ============================================================
 * 连续失败计数（供上层业务使用）
 * ============================================================ */
export async function withDbHealth<T>(fn: () => Promise<T>): Promise<T> {
  try {
    const result = await fn();
    consecutiveFailures = 0;
    return result;
  } catch (err) {
    consecutiveFailures++;
    if (consecutiveFailures >= DB_FAIL_THRESHOLD) {
      void sendAlert({
        level: "critical",
        title: "database_consecutive_failures",
        message: `数据库连续失败 ${consecutiveFailures} 次`,
        source: "database",
        data: { error: String((err as Error)?.message) },
      });
    }
    throw err;
  }
}
