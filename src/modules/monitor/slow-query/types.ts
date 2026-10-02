export interface SlowQueryRow {
  id: string;
  tenant_id: string | null;
  fingerprint: string;
  query_sample: string;
  query_hash: string;
  calls: number;
  total_time_ms: number;
  mean_time_ms: number;
  max_time_ms: number;
  p95_time_ms: number;
  rows: number;
  first_seen_at: Date;
  last_seen_at: Date;
  status: string;
  reviewer_id: string | null;
  review_note: string | null;
  reviewed_at: Date | null;
}

/** 采集入参 */
export interface SlowQueryInput {
  sql: string;
  durationMs: number;
  rows?: number;
  tenantId?: string | null;
}

/** 聚合后待写库的记录 */
export interface AggregatedRecord {
  fingerprint: string;
  tenantId: string | null;
  normalizedSql: string;
  rawSample: string;
  calls: number;
  totalTimeMs: number;
  maxTimeMs: number;
  rows: number;
  lastSeenAt: Date;
}

/** 列表查询参数 */
export interface SlowQueryListQuery {
  pageNum?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  minMeanMs?: number;
  minTotalMs?: number;
  tenantId?: string;
  /** 排序：mean | total | calls | last_seen */
  orderBy?: "mean" | "total" | "calls" | "last_seen";
}
