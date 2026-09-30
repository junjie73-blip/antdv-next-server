import { MinioStorage } from "./minio.js";
import { env } from "@/config/env.js";
import type { IStorage } from "./types.js";

/**
 * 系统级存储（用于归档、备份等跨租户任务）
 * 走环境变量 MINIO_* 配置，不依赖租户配置
 */
let systemStorage: IStorage | null = null;

export function getSystemStorage(): IStorage {
  if (systemStorage) return systemStorage;

  systemStorage = new MinioStorage({
    endpoint: env.MINIO_ENDPOINT,
    port: Number(env.MINIO_PORT ?? 9000),
    useSSL: env.MINIO_USE_SSL ?? false,
    region: env.MINIO_REGION ?? "us-east-1",
    // ⭐ 归档走独立 bucket（如未配置则复用主 bucket）
    bucket: env.MINIO_ARCHIVE_BUCKET ?? env.MINIO_BUCKET,
    accessKey: env.MINIO_ACCESS_KEY,
    secretKey: env.MINIO_SECRET_KEY,
    publicUrl: env.MINIO_PUBLIC_URL,
  });

  return systemStorage;
}
