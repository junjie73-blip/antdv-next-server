export type ScanType = "schema" | "query" | "runtime";
export type Severity = "info" | "warning" | "critical";

export interface ScanRule {
  code: string;
  severity: Severity;
  scanType: ScanType;
  title: string;
  description: string;
}

export const SCAN_RULES: Record<string, ScanRule> = {
  TENANT_MISSING_COLUMN: {
    code: "TENANT_MISSING_COLUMN",
    severity: "critical",
    scanType: "schema",
    title: "业务表缺少 tenant_id 列",
    description: "非平台表必须包含 tenant_id 以保证隔离",
  },
  TENANT_MISSING_INDEX: {
    code: "TENANT_MISSING_INDEX",
    severity: "warning",
    scanType: "schema",
    title: "tenant_id 无索引",
    description: "会导致全表扫描，多租户场景下性能急剧下降",
  },
  TENANT_MISSING_COMPOSITE_INDEX: {
    code: "TENANT_MISSING_COMPOSITE_INDEX",
    severity: "info",
    scanType: "schema",
    title: "缺少 (tenant_id, is_deleted) 组合索引",
    description: "推荐补充，用于加速最常见的软删除过滤",
  },
  TENANT_NULLABLE: {
    code: "TENANT_NULLABLE",
    severity: "warning",
    scanType: "schema",
    title: "tenant_id 允许 NULL",
    description: "会导致 WHERE tenant_id = ? 无法命中 NULL 行",
  },
  TENANT_MISSING_FILTER: {
    code: "TENANT_MISSING_FILTER",
    severity: "critical",
    scanType: "query",
    title: "查询未带 tenant_id",
    description: "findMany/findFirst 必须带 tenant_id 条件",
  },
  TENANT_UPDATE_NO_TENANT: {
    code: "TENANT_UPDATE_NO_TENANT",
    severity: "critical",
    scanType: "query",
    title: "批量更新/删除未带 tenant_id",
    description: "updateMany/deleteMany 必须带 tenant_id，防止跨租户操作",
  },
  TENANT_RAW_SQL_UNSAFE: {
    code: "TENANT_RAW_SQL_UNSAFE",
    severity: "critical",
    scanType: "query",
    title: "使用 $executeRawUnsafe",
    description: "存在 SQL 注入风险，且无法保证租户隔离",
  },
  TENANT_CROSS_LEAK: {
    code: "TENANT_CROSS_LEAK",
    severity: "critical",
    scanType: "runtime",
    title: "检测到跨租户数据",
    description: "返回结果中包含非当前租户的记录",
  },
  TENANT_FOREIGN_KEY_NO_CHECK: {
    code: "TENANT_FOREIGN_KEY_NO_CHECK",
    severity: "warning",
    scanType: "query",
    title: "关联表写入未校验归属",
    description: "createMany 前必须调用 assertOwnership",
  },
};

export const PLATFORM_TABLES = new Set([
  "sys_tenant",
  "sys_api_version",
  "sys_feature_flag",
  "sys_feature_flag_rule",
  "sys_backup_policy",
  "sys_backup_record",
  "sys_tenant_isolation_scan",
  "sys_tenant_isolation_run",
  "_prisma_migrations",
]);
