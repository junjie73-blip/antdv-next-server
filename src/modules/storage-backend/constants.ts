export const BACKEND_TYPE = {
  LOCAL: "local",
  MINIO: "minio",
  OSS: "oss",
  COS: "cos",
  S3: "s3",
} as const;
export type BackendType = (typeof BACKEND_TYPE)[keyof typeof BACKEND_TYPE];
export const BACKEND_TYPES = Object.values(BACKEND_TYPE);

/** 健康检查间隔（秒） */
export const HEALTH_CHECK_INTERVAL = 60;

/** 连续失败次数达到此值自动降级 */
export const FAILOVER_THRESHOLD = 3;

/** 配置缓存 TTL（秒） */
export const BACKEND_CACHE_TTL = 300;

/** 敏感字段（config 内）*/
export const SENSITIVE_CONFIG_KEYS = [
  "accessKey",
  "accessKeyId",
  "accessKeySecret",
  "secretKey",
  "secretId",
  "secretAccessKey",
  "password",
] as const;
