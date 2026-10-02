export const LOKI_DEFAULT_LIMIT = 200;
export const LOKI_MAX_LIMIT = 1000;
export const LOKI_MAX_RANGE_HOURS = 24;

/** 允许的 label 白名单（防注入） */
export const LOKI_ALLOWED_LABELS = [
  "app",
  "env",
  "service",
  "level",
  "module",
  "tenant_id",
] as const;
export type LokiLabel = (typeof LOKI_ALLOWED_LABELS)[number];
