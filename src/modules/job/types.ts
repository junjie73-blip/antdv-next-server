/** 定时任务实体 */
export interface JobEntity {
  job_id: string;
  tenant_id: string;
  job_name: string;
  job_group: string;
  invoke_target: string;
  cron_expression: string;
  misfire_policy: number;
  concurrent: number;
  status: string;
  remark: string | null;
  is_deleted: number;
  retry_count: number;
  retry_interval: number;
  timeout_seconds: number;
  is_paused: number;
  last_run_at: Date | null;
  next_run_at: Date | null;
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  updated_by: string | null;
}

/** 任务日志实体 */
export interface JobLogEntity {
  log_id: string;
  job_id: string;
  job_name: string;
  invoke_target: string;
  job_message: string | null;
  status: string;
  exception_info: string | null;
  created_at: Date;
  retry_attempt: number;
  duration_ms: number;
  created_by: string | null;
}
