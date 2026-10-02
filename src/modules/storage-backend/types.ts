export interface StorageBackendEntity {
  backend_id: string;
  tenant_id: string;
  backend_type: string;
  backend_name: string;
  config: Record<string, unknown>;
  is_active: number;
  is_healthy: number;
  priority: number;
  last_check_at: Date | null;
  last_check_err: string | null;
  remark: string | null;
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  updated_by: string | null;
  is_deleted: number;
}

/** 脱敏后的输出 */
export interface StorageBackendVO extends Omit<StorageBackendEntity, "config"> {
  config: Record<string, unknown>;
}

export interface HealthCheckResult {
  backendId: string;
  healthy: boolean;
  latencyMs: number;
  error?: string;
  checkedAt: Date;
}
