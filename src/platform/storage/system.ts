import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";
import { env } from "@/config/env.js";
import { buildClient } from "./factory.js";
import { decrypt } from "@/core/security/crypto.js";
import type { IStorage, StorageConfig } from "./types.js";

const ENCRYPTED_PREFIX = "encrypted.";
const PLATFORM_TENANT_ID =
  env.TEMPLATE_TENANT_ID ?? "00000000-0000-0000-0000-000000000000";

/* ============================================================
 * 缓存
 * ============================================================ */
let cached: IStorage | null = null;
let cachedHash: string | null = null;
let inflight: Promise<IStorage> | null = null;

/** ⭐ 主入口：异步取系统存储实例 */
export async function getSystemStorage(): Promise<IStorage> {
  if (cached && cachedHash === (await currentHash())) return cached;

  // singleflight：并发调用只查一次 DB
  if (inflight) return inflight;

  inflight = loadSystemStorage()
    .then((storage) => {
      cached = storage;
      return storage;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/** ⭐ 启动时预热（可选，避免首次调用时阻塞） */
export async function initSystemStorage(): Promise<void> {
  try {
    const storage = await getSystemStorage();
    logger.info({ type: storage.type }, "[storage:system] initialized");
  } catch (err) {
    logger.error({ err }, "[storage:system] init failed");
    throw err;
  }
}

/** ⭐ 配置变更后调用 */
export function invalidateSystemStorage(): void {
  cached = null;
  cachedHash = null;
  inflight = null;
  logger.info("[storage:system] cache invalidated");
}

/* ============================================================
 * 加载：DB > env 兜底
 * ============================================================ */
async function loadSystemStorage(): Promise<IStorage> {
  const cfg = await loadConfigFromDb();

  if (cfg) {
    const storage = buildClient(cfg.storage, cfg);
    logger.info(
      { type: cfg.storage, source: "db" },
      "[storage:system] created from db config",
    );
    return storage;
  }

  // 兜底：环境变量（兼容老 MINIO_* 配置）
  const fallback = buildConfigFromEnv();
  const storage = buildClient(fallback.storage, fallback);
  logger.warn(
    { type: fallback.storage, source: "env" },
    "[storage:system] db config missing, fallback to env",
  );
  return storage;
}

/* ============================================================
 * 从 sys_config 读
 * ============================================================ */
async function loadConfigFromDb(): Promise<StorageConfig | null> {
  let rows;
  try {
    rows = await prisma.sys_config.findMany({
      where: {
        tenant_id: PLATFORM_TENANT_ID,
        OR: [
          { config_key: { startsWith: "system.storage." } },
          { config_key: { startsWith: `${ENCRYPTED_PREFIX}system.storage.` } },
        ],
        is_deleted: 0,
      },
    });
  } catch (err) {
    logger.warn({ err }, "[storage:system] read config failed");
    return null;
  }

  if (rows.length === 0) return null;

  const map: Record<string, string> = {};
  for (const r of rows) {
    if (r.config_key.startsWith(ENCRYPTED_PREFIX)) {
      const realKey = r.config_key.slice(ENCRYPTED_PREFIX.length);
      const v = r.config_value ?? "";
      if (v) {
        try {
          map[realKey] = decrypt(v);
        } catch (err) {
          logger.error(
            { err, key: r.config_key },
            "[storage:system] decrypt failed",
          );
          map[realKey] = "";
        }
      } else {
        map[realKey] = "";
      }
    } else {
      map[r.config_key] = r.config_value ?? "";
    }
  }

  const type = map["system.storage.type"] as
    | StorageConfig["storage"]
    | undefined;
  if (!type) return null;

  return {
    storage: type,
    localPath: map["system.storage.localPath"] || "uploads/system",
    localUrl: map["system.storage.localUrl"] || "/uploads/system",
    endpoint: map["system.storage.endpoint"] || undefined,
    port: map["system.storage.port"]
      ? Number(map["system.storage.port"])
      : undefined,
    useSSL: map["system.storage.useSSL"] === "true",
    region: map["system.storage.region"] || undefined,
    bucket: map["system.storage.bucket"] || undefined,
    accessKeyId: map["system.storage.accessKeyId"] || undefined,
    accessKeySecret: map["system.storage.accessKeySecret"] || undefined,
    customDomain: map["system.storage.customDomain"] || undefined,
  };
}

/* ============================================================
 * 从 env 构造（兼容老 MINIO_* 或新增 SYSTEM_STORAGE_*）
 * ============================================================ */
function buildConfigFromEnv(): StorageConfig {
  // 优先新的通用变量（如果未来加了）
  const explicit = env.SYSTEM_STORAGE_TYPE as
    | StorageConfig["storage"]
    | undefined;

  if (explicit) {
    return {
      storage: explicit,
      localPath: env.SYSTEM_STORAGE_LOCAL_PATH ?? "uploads/system",
      localUrl: env.SYSTEM_STORAGE_LOCAL_URL ?? "/uploads/system",
      endpoint: env.SYSTEM_STORAGE_ENDPOINT,
      port: env.SYSTEM_STORAGE_PORT
        ? Number(env.SYSTEM_STORAGE_PORT)
        : undefined,
      useSSL: env.SYSTEM_STORAGE_USE_SSL,
      region: env.SYSTEM_STORAGE_REGION,
      bucket: env.SYSTEM_STORAGE_BUCKET,
      accessKeyId: env.SYSTEM_STORAGE_ACCESS_KEY_ID,
      accessKeySecret: env.SYSTEM_STORAGE_ACCESS_KEY_SECRET,
      customDomain: env.SYSTEM_STORAGE_CUSTOM_DOMAIN,
    };
  }

  // 兜底：MINIO_* （保持旧行为）
  return {
    storage: "minio",
    endpoint: env.MINIO_ENDPOINT,
    port: Number(env.MINIO_PORT ?? 9000),
    useSSL: env.MINIO_USE_SSL ?? false,
    region: env.MINIO_REGION ?? "us-east-1",
    bucket: env.MINIO_ARCHIVE_BUCKET ?? env.MINIO_BUCKET,
    accessKeyId: env.MINIO_ACCESS_KEY,
    accessKeySecret: env.MINIO_SECRET_KEY,
    customDomain: env.MINIO_PUBLIC_URL,
  };
}

/* ============================================================
 * 配置 hash（用于判断缓存是否过期）
 * ============================================================ */
async function currentHash(): Promise<string> {
  try {
    const rows = await prisma.sys_config.findMany({
      where: {
        tenant_id: PLATFORM_TENANT_ID,
        OR: [
          { config_key: { startsWith: "system.storage." } },
          { config_key: { startsWith: `${ENCRYPTED_PREFIX}system.storage.` } },
        ],
        is_deleted: 0,
      },
      select: { config_key: true, updated_at: true },
    });
    return rows
      .map((r) => `${r.config_key}@${r.updated_at.getTime()}`)
      .sort()
      .join("|");
  } catch {
    return "";
  }
}
