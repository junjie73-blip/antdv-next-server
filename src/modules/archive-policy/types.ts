export interface ArchivePolicyEntity {
  policy_id: string;
  table_name: string;
  display_name: string;
  table_type: string;
  time_column: string;
  retention_months: number;
  archive_enabled: number;
  storage_enabled: number;
  batch_size: number;
  cron_expression: string;
  enabled: number;
  last_run_at: Date | null;
  last_status: string | null;
  last_error: string | null;
  remark: string | null;
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  updated_by: string | null;
  is_deleted: number;
}

export interface ArchiveLogEntity {
  log_id: string;
  policy_id: string | null;
  table_name: string;
  partition_name: string | null;
  archive_mode: string;
  retention_start: Date | null;
  retention_end: Date | null;
  row_count: bigint;
  archived_size: bigint;
  archive_url: string | null;
  status: string;
  error_msg: string | null;
  duration_ms: number;
  started_at: Date;
  finished_at: Date | null;
  created_by: string | null;
}

/** 归档执行结果 */
export interface ArchiveExecutionResult {
  tableName: string;
  mode: string;
  partitions: Array<{
    name: string;
    rowCount: number;
    size: number;
    archiveUrl: string | null;
    status: string;
    error?: string;
  }>;
  totalRows: number;
  totalSize: number;
  durationMs: number;
  status: string;
}

/** 归档执行上下文 */
export interface ArchiveExecutionOptions {
  policyId: string;
  tableName: string;
  tableType: string;
  timeColumn: string;
  retentionMonths: number;
  batchSize: number;
  storageEnabled: boolean;
  operatorId?: string;
  /** 是否 dry-run（只统计，不删除） */
  dryRun?: boolean;
}
