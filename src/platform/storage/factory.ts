import { logger } from "@/platform/logger/index.js";
import { LocalStorage } from "./local.js";
import { MinioStorage } from "./minio.js";
import { OssStorage } from "./oss.js";
import { CosStorage } from "./cos.js";
import { S3Storage } from "./s3.js";
import type { IStorage, StorageConfig, PutObjectInput } from "./types.js";
import { env } from "@/config/env.js";
import { AppError } from "@/middleware/http/index.js";
import { createReadStream } from "fs";

export interface UploadStreamInput {
  tenantId?: string;
  key: string;
  filePath?: string;
  stream?: NodeJS.ReadableStream;
  contentType?: string;
  contentLength?: number;
  storage?: IStorage;
}

/* ============================================================
 * 租户级存储实例缓存
 * ============================================================ */
const cache = new Map<string, { storage: IStorage; hash: string }>();

function hashCode(cfg: StorageConfig): string {
  return JSON.stringify({
    s: cfg.storage,
    e: cfg.endpoint,
    r: cfg.region,
    b: cfg.bucket,
    k: cfg.accessKeyId,
    p: cfg.localPath,
    u: cfg.localUrl,
    d: cfg.customDomain,
    ssl: cfg.useSSL,
  });
}

export function createStorage(tenantId: string, cfg: StorageConfig): IStorage {
  const hash = hashCode(cfg);
  const hit = cache.get(tenantId);
  if (hit && hit.hash === hash) return hit.storage;

  let storage: IStorage;

  switch (cfg.storage) {
    case "local":
      storage = new LocalStorage({
        root: cfg.localPath || "uploads/files",
        urlPrefix: cfg.localUrl || "/uploads",
      });
      break;

    case "minio":
      storage = new MinioStorage({
        endpoint: cfg.endpoint ?? "",
        port: cfg.port ?? 9000,
        useSSL: cfg.useSSL ?? false,
        region: cfg.region ?? "us-east-1",
        bucket: cfg.bucket ?? "",
        accessKey: cfg.accessKeyId ?? "",
        secretKey: cfg.accessKeySecret ?? "",
        publicUrl: cfg.customDomain || undefined,
      });
      break;

    case "oss":
      storage = new OssStorage({
        region: cfg.region ?? "",
        bucket: cfg.bucket ?? "",
        accessKeyId: cfg.accessKeyId ?? "",
        accessKeySecret: cfg.accessKeySecret ?? "",
        endpoint: cfg.endpoint,
        customDomain: cfg.customDomain,
      });
      break;

    case "cos":
      storage = new CosStorage({
        region: cfg.region ?? "",
        bucket: cfg.bucket ?? "",
        secretId: cfg.accessKeyId ?? "",
        secretKey: cfg.accessKeySecret ?? "",
        customDomain: cfg.customDomain,
      });
      break;

    case "s3":
      storage = new S3Storage({
        region: cfg.region ?? "",
        bucket: cfg.bucket ?? "",
        accessKeyId: cfg.accessKeyId ?? "",
        accessKeySecret: cfg.accessKeySecret ?? "",
        customDomain: cfg.customDomain,
      });
      break;

    default:
      throw new AppError(`不支持的存储类型：${cfg.storage}`, 400001, 400);
  }

  logger.info(
    { tenantId, storage: storage.type },
    "[storage] instance created",
  );
  cache.set(tenantId, { storage, hash });
  return storage;
}

export function invalidateStorage(tenantId: string): void {
  cache.delete(tenantId);
  logger.debug({ tenantId }, "[storage] cache invalidated");
}

/**
 * ⭐ 新增：对外暴露，供 Worker / Service 使用
 */
export async function getStorageForTenant(tenantId: string): Promise<IStorage> {
  const { SettingsService } =
    await import("@/modules/system/setting/service.js");
  const settingsService = new SettingsService();
  const cfg = await settingsService.getUploadConfigRaw(tenantId);

  return createStorage(tenantId, {
    storage: cfg.storage as any,
    localPath: cfg.localPath,
    localUrl: cfg.localUrl,
    endpoint: cfg.minioEndpoint || cfg.ossEndpoint || undefined,
    port: cfg.minioPort,
    useSSL: cfg.minioUseSSL,
    region: cfg.minioRegion || cfg.ossRegion || cfg.cosRegion || cfg.s3Region,
    bucket: cfg.minioBucket || cfg.ossBucket || cfg.cosBucket || cfg.s3Bucket,
    accessKeyId:
      cfg.minioAccessKey ||
      cfg.ossAccessKeyId ||
      cfg.cosSecretId ||
      cfg.s3AccessKeyId,
    accessKeySecret:
      (cfg.minioSecretKey !== "******" ? cfg.minioSecretKey : "") ||
      (cfg.ossAccessKeySecret !== "******" ? cfg.ossAccessKeySecret : "") ||
      (cfg.cosSecretKey !== "******" ? cfg.cosSecretKey : "") ||
      (cfg.s3AccessKeySecret !== "******" ? cfg.s3AccessKeySecret : "") ||
      undefined,
    customDomain:
      cfg.minioPublicUrl ||
      cfg.ossCustomDomain ||
      cfg.cosCustomDomain ||
      cfg.s3CustomDomain,
  });
}

/**
 * ⭐ 新增：Buffer 上传，返回 URL
 * 供 Worker / 异步任务使用
 */
export async function uploadBuffer(input: {
  tenantId: string;
  key: string;
  body: Buffer;
  contentType?: string;
}): Promise<{ url: string; key: string; size: number }> {
  const storage = await getStorageForTenant(input.tenantId);

  await storage.putObject({
    key: input.key,
    body: input.body,
    contentType: input.contentType,
    contentLength: input.body.length,
  });

  return {
    url: storage.buildPublicUrl(input.key),
    key: input.key,
    size: input.body.length,
  };
}

export async function deleteFileByUrl(
  tenantId: string,
  url: string,
): Promise<void> {
  const storage = await getStorageForTenant(tenantId);
  const key = storage.keyFromUrl(url);
  if (!key) return;
  await storage.deleteObject(key);
}

export async function uploadStream(input: UploadStreamInput): Promise<void> {
  if (!input.storage && !input.tenantId) {
    throw new Error("uploadStream: storage 或 tenantId 必须传一个");
  }

  const storage = input.storage ?? (await getStorageForTenant(input.tenantId!));

  let body: Buffer | NodeJS.ReadableStream;
  if (input.filePath) {
    body = createReadStream(input.filePath);
  } else if (input.stream) {
    body = input.stream;
  } else {
    throw new Error("uploadStream: filePath 或 stream 必须传一个");
  }

  await storage.putObject({
    key: input.key,
    body: body as any,
    contentType: input.contentType,
    contentLength: input.contentLength,
  });
}
