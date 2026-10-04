import { createHash } from "node:crypto";
import { createReadStream } from "fs";
import { logger } from "@/platform/logger/index.js";
import { env } from "@/config/env.js";
import { AppError } from "@/middleware/http/index.js";

import { LocalStorage } from "./local.js";
import { MinioStorage } from "./minio.js";
import { OssStorage } from "./oss.js";
import { CosStorage } from "./cos.js";
import { S3Storage } from "./s3.js";
import type { IStorage, StorageConfig } from "./types.js";

import { StorageBackendRepository } from "@/modules/storage-backend/repository.js";
import { getActiveBackend, setActiveBackend } from "@/modules/storage-backend/cache.js";
import { decryptSensitive } from "@/modules/storage-backend/sensitive.js";
import { SENSITIVE_CONFIG_KEYS } from "@/modules/storage-backend/constants.js";

/* ============================================================
 * 类型
 * ============================================================ */
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
 * 缓存
 * ============================================================ */
const VALID_STORAGE_TYPES = ["local", "minio", "oss", "cos", "s3"] as const;
type StorageType = (typeof VALID_STORAGE_TYPES)[number];

function isStorageType(v: unknown): v is StorageType {
  return typeof v === "string" && (VALID_STORAGE_TYPES as readonly string[]).includes(v);
}

const clients = new Map<string, unknown>();
const repo = new StorageBackendRepository();

/** ⭐ 租户级 storage 缓存 */
interface CachedStorage {
  storage: IStorage;
  hash: string;
  expireAt: number;
}
const STORAGE_CACHE_TTL_MS = 5 * 60_000;
const storageCache = new Map<string, CachedStorage>();

/** ⭐ 配置指纹 */
function fingerprint(cfg: any): string {
  const raw = JSON.stringify({
    s: cfg.storage,
    lp: cfg.localPath,
    lu: cfg.localUrl,
    e: cfg.minioEndpoint || cfg.ossEndpoint,
    p: cfg.minioPort,
    ssl: cfg.minioUseSSL,
    r: cfg.minioRegion || cfg.ossRegion || cfg.cosRegion || cfg.s3Region,
    b: cfg.minioBucket || cfg.ossBucket || cfg.cosBucket || cfg.s3Bucket,
    k: cfg.minioAccessKey || cfg.ossAccessKeyId || cfg.cosSecretId || cfg.s3AccessKeyId,
    sk: createHash("sha1")
      .update(
        cfg.minioSecretKey ||
          cfg.ossAccessKeySecret ||
          cfg.cosSecretKey ||
          cfg.s3AccessKeySecret ||
          "",
      )
      .digest("hex")
      .slice(0, 16),
    d: cfg.minioPublicUrl || cfg.ossCustomDomain || cfg.cosCustomDomain || cfg.s3CustomDomain,
  });
  return createHash("sha1").update(raw).digest("hex");
}

/* ============================================================
 * ⭐ 核心：按租户构建 storage（带缓存）
 * ============================================================ */
export async function getStorageForTenant(tenantId: string): Promise<IStorage> {
  const now = Date.now();
  const cached = storageCache.get(tenantId);

  if (cached && cached.expireAt > now) {
    return cached.storage;
  }

  const { SettingsService } = await import("@/modules/system/setting/service.js");
  const settingsService = new SettingsService();
  const cfg = await settingsService.getUploadConfigRaw(tenantId);

  const hash = fingerprint(cfg);

  // 指纹未变 → 复用旧实例，仅刷新 TTL
  if (cached && cached.hash === hash) {
    cached.expireAt = now + STORAGE_CACHE_TTL_MS;
    return cached.storage;
  }

  const storage = buildClient(cfg.storage, {
    storage: cfg.storage as any,
    localPath: cfg.localPath,
    localUrl: cfg.localUrl,
    endpoint: cfg.minioEndpoint || cfg.ossEndpoint || undefined,
    port: cfg.minioPort,
    useSSL: cfg.minioUseSSL,
    region: cfg.minioRegion || cfg.ossRegion || cfg.cosRegion || cfg.s3Region,
    bucket: cfg.minioBucket || cfg.ossBucket || cfg.cosBucket || cfg.s3Bucket,
    accessKeyId: cfg.minioAccessKey || cfg.ossAccessKeyId || cfg.cosSecretId || cfg.s3AccessKeyId,
    accessKeySecret:
      cfg.minioSecretKey ||
      cfg.ossAccessKeySecret ||
      cfg.cosSecretKey ||
      cfg.s3AccessKeySecret ||
      undefined,
    customDomain:
      cfg.minioPublicUrl || cfg.ossCustomDomain || cfg.cosCustomDomain || cfg.s3CustomDomain,
  });

  storageCache.set(tenantId, {
    storage,
    hash,
    expireAt: now + STORAGE_CACHE_TTL_MS,
  });

  logger.info(
    { tenantId, storage: cfg.storage, bucket: cfg.minioBucket || cfg.ossBucket },
    "[storage] cache built",
  );

  return storage;
}

/* ============================================================
 * ⭐ buildClient（参数校验加固）
 * ============================================================ */
export function buildClient(type: string, cfg: any): IStorage {
  if (!isStorageType(type)) {
    throw new AppError(
      `buildClient 参数错误：第一个参数必须是存储类型（${VALID_STORAGE_TYPES.join(" | ")}），` +
        `实际收到 "${type}"。若想按租户生成实例，请改用 getStorageForTenant(tenantId)。`,
      400001,
      400,
    );
  }

  if (!cfg || typeof cfg !== "object") {
    throw new AppError("buildClient 参数错误：cfg 不能为空", 400001, 400);
  }

  let storage: IStorage;

  switch (type) {
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

    default: {
      const _exhaustive: never = type;
      throw new AppError(`未实现的存储类型：${_exhaustive}`, 400001, 400);
    }
  }

  logger.info({ type, bucket: cfg.bucket, endpoint: cfg.endpoint }, "[storage] instance created");
  return storage;
}

/* ============================================================
 * 按后端配置构建（保留原语义）
 * ============================================================ */
export async function getStorageFor(tenantId: string): Promise<unknown> {
  let cached = clients.get(tenantId);
  if (cached) return cached;

  let active = await getActiveBackend(tenantId);

  if (!active) {
    const row = await repo.findActive(tenantId);
    if (row) {
      active = {
        backend_id: row.backend_id,
        backend_type: row.backend_type,
        config: row.config,
      };
      await setActiveBackend(tenantId, active);
    }
  }

  if (!active) {
    return getDefaultStorage();
  }

  const config = decryptSensitive(active.config as Record<string, unknown>, SENSITIVE_CONFIG_KEYS);
  const client = buildClient(active.backend_type, config);
  clients.set(tenantId, client);
  return client;
}

/* ============================================================
 * 缓存失效
 * ============================================================ */
export function invalidateStorage(tenantId: string): void {
  clients.delete(tenantId);
  storageCache.delete(tenantId);
  logger.info({ tenantId }, "[storage] cache invalidated");
}

/* ============================================================
 * Buffer 上传（供 Worker 使用）
 * ============================================================ */
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

/* ============================================================
 * 删除
 * ============================================================ */
export async function deleteFileByUrl(tenantId: string, url: string): Promise<void> {
  const storage = await getStorageForTenant(tenantId);
  const key = storage.keyFromUrl(url);
  if (!key) return;
  await storage.deleteObject(key);
}

/* ============================================================
 * 流上传
 * ============================================================ */
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

/* ============================================================
 * 默认（未配置时的兜底）
 * ============================================================ */
function getDefaultStorage(): IStorage {
  // 走环境变量兜底
  if (env.MINIO_ENABLED) {
    return buildClient("minio", {
      storage: "minio",
      endpoint: env.MINIO_ENDPOINT,
      port: Number(env.MINIO_PORT ?? 9000),
      useSSL: env.MINIO_USE_SSL ?? false,
      region: env.MINIO_REGION ?? "us-east-1",
      bucket: env.MINIO_BUCKET,
      accessKeyId: env.MINIO_ACCESS_KEY,
      accessKeySecret: env.MINIO_SECRET_KEY,
      customDomain: env.MINIO_PUBLIC_URL,
    });
  }

  return buildClient("local", {
    storage: "local",
    localPath: env.UPLOAD_ROOT || "uploads/files",
    localUrl: "/uploads",
  });
}
