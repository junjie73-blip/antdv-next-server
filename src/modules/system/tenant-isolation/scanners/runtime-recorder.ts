import { redis } from "@/config/redis.js";
import { logger } from "@/platform/logger/index.js";
import { env } from "@/config/env.js";
import { TenantIsolationRepository } from "../repository.js";
import { SCAN_RULES } from "../rules.js";

/* ============================================================
 * 配置
 * ============================================================ */
/** 是否启用运行时探针（默认关闭，性能敏感时靠这个开关关掉） */
const RUNTIME_PROBE_ENABLED = env.TENANT_PROBE_ENABLED;

/** 同一 (table, method, tenantId) 去重窗口（秒） */
const DEDUP_TTL_SEC = 300;

/** 写库失败时的降级日志 */
const repo = new TenantIsolationRepository();

/* ============================================================
 * 入口
 * ============================================================ */
export interface RuntimeViolationInput {
  /** 表名（不一定是 DB 表名，用 Repo 的 model 名即可） */
  tableName: string;
  /** 触发方法：findMany / findFirst / paginate ... */
  method: string;
  /** 当前请求的租户 */
  tenantId: string;
  /** 泄漏条数 */
  leakedCount: number;
  /** 泄漏样本（可选，来自 probeCrossTenant） */
  samples?: Array<Record<string, unknown>>;
  /** 操作者（可选，从 req.user 来） */
  userId?: string;
}

/**
 * 记录运行时跨租户泄漏。
 * - 异步、非阻塞
 * - Redis 去重（窗口内同一 target 只写一次）
 * - 写库失败降级到日志
 */
export async function recordRuntimeViolation(
  input: RuntimeViolationInput,
): Promise<void> {
  if (!RUNTIME_PROBE_ENABLED) return;

  try {
    const dedupKey = `tenant:probe:${input.tenantId}:${input.tableName}:${input.method}`;

    // 1. SET NX 去重（成功才继续写库）
    const acquired = await redis.set(dedupKey, "1", "EX", DEDUP_TTL_SEC, "NX");
    if (acquired !== "OK") return;

    // 2. 写库
    await repo.recordViolation({
      scanType: "runtime",
      rule: SCAN_RULES.TENANT_CROSS_LEAK,
      tableName: input.tableName,
      columnName: input.method,
      message: `检测到跨租户数据：租户 ${input.tenantId} 的 ${input.method} 返回了 ${input.leakedCount} 条非本租户记录`,
      context: {
        tenantId: input.tenantId,
        userId: input.userId,
        method: input.method,
        leakedCount: input.leakedCount,
        samples: input.samples ?? [],
        detectedAt: new Date().toISOString(),
      },
      suggestion:
        "检查 BaseRepository 或手动 findMany 的 where 条件是否遗漏 tenant_id，" +
        "或查询了关联表但未在 include/select 时限制租户",
    });

    logger.error(
      {
        table: input.tableName,
        method: input.method,
        tenantId: input.tenantId,
        leakedCount: input.leakedCount,
      },
      "[tenant-isolation:runtime] ⚠️ cross-tenant data detected",
    );
  } catch (err) {
    // 失败降级：绝不因探针失败而影响业务
    logger.warn({ err, ...input }, "[tenant-isolation:runtime] record failed");
  }
}

/**
 * 供外部查询开关状态（管理后台展示用）
 */
export function isRuntimeProbeEnabled(): boolean {
  return RUNTIME_PROBE_ENABLED;
}
