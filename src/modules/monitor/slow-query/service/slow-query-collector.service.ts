import { logger } from "@/platform/logger/index.js";
import { SlowQueryRepository } from "../repository.js";
import { fingerprintOf } from "../normalizer.js";
import {
  SLOW_QUERY_MS,
  FLUSH_SIZE,
  FLUSH_INTERVAL_MS,
  MAX_SAMPLE_LEN,
  SKIP_SQL_PATTERNS,
} from "../constants.js";
import type { AggregatedRecord, SlowQueryInput } from "../types.js";

/**
 * 慢查询采集器
 * - 内存 buffer 聚合
 * - 定时/定量 flush
 * - 防递归（跳过日志表写入）
 * - fail-soft：写失败仅丢日志
 */
export class SlowQueryCollectorService {
  private repo = new SlowQueryRepository();
  private buffer: SlowQueryInput[] = [];
  private timer: NodeJS.Timeout | null = null;
  private flushing = false;
  private suspended = 0;

  /** 从 database.ts 的 query 回调调用 */
  record(input: SlowQueryInput): void {
    if (this.suspended > 0) return;
    if (input.durationMs < SLOW_QUERY_MS) return;
    if (this.shouldSkip(input.sql)) return;

    this.buffer.push(input);
    this.ensureTimer();

    if (this.buffer.length >= FLUSH_SIZE) {
      void this.flush();
    }
  }

  /** 短时挂起（flush 期间避免自采集） */
  suspend(): void {
    this.suspended++;
  }

  resume(): void {
    this.suspended = Math.max(0, this.suspended - 1);
  }

  /** 手动 flush（优雅退出时调用） */
  async flush(): Promise<number> {
    if (this.flushing) return 0;
    if (this.buffer.length === 0) return 0;

    this.flushing = true;
    this.suspend();
    const batch = this.buffer.splice(0, this.buffer.length);
    try {
      const aggregated = this.aggregate(batch);
      const n = await this.repo.upsertBatch(aggregated);
      if (n > 0) {
        logger.debug(
          { batch: batch.length, aggregated: aggregated.length, upserted: n },
          "[slow-query] flushed",
        );
      }
      return n;
    } catch (err) {
      logger.warn({ err }, "[slow-query] flush failed, dropping batch");
      return 0;
    } finally {
      this.resume();
      this.flushing = false;
    }
  }

  /** 停止定时器（进程退出时） */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /* ============================================================
   * 内部
   * ============================================================ */
  private ensureTimer(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.flush();
    }, FLUSH_INTERVAL_MS);
    this.timer.unref();
  }

  private shouldSkip(sql: string): boolean {
    return SKIP_SQL_PATTERNS.some((re) => re.test(sql));
  }

  private aggregate(batch: SlowQueryInput[]): AggregatedRecord[] {
    const map = new Map<string, AggregatedRecord>();

    for (const input of batch) {
      const { normalized, fingerprint } = fingerprintOf(
        input.sql,
        input.tenantId,
      );
      const key = fingerprint;

      const existing = map.get(key);
      if (existing) {
        existing.calls += 1;
        existing.totalTimeMs += Math.round(input.durationMs);
        existing.maxTimeMs = Math.max(
          existing.maxTimeMs,
          Math.round(input.durationMs),
        );
        existing.rows += input.rows ?? 0;
        existing.lastSeenAt = new Date();
      } else {
        map.set(key, {
          fingerprint,
          tenantId: input.tenantId ?? null,
          normalizedSql: normalized,
          rawSample: input.sql.slice(0, MAX_SAMPLE_LEN),
          calls: 1,
          totalTimeMs: Math.round(input.durationMs),
          maxTimeMs: Math.round(input.durationMs),
          rows: input.rows ?? 0,
          lastSeenAt: new Date(),
        });
      }
    }

    return [...map.values()];
  }
}

export const slowQueryCollector = new SlowQueryCollectorService();
