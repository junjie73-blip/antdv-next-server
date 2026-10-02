import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";
import { env } from "@/config/env.js";

export type ApiVersionStatus = "active" | "deprecated" | "sunset";

export interface ApiVersionMeta {
  code: string;
  name: string;
  status: ApiVersionStatus;
  isDefault: boolean;
  releaseAt: Date;
  deprecatedAt: Date | null;
  sunsetAt: Date | null;
  changelog?: unknown;
}

/* ============================================================
 * 全局缓存（进程内）
 * ============================================================ */
let cached: ApiVersionMeta[] | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000;

/* ============================================================
 * 加载：优先 DB，失败回退环境变量
 * ============================================================ */
export async function loadApiVersions(
  force = false,
): Promise<ApiVersionMeta[]> {
  if (!force && cached && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  try {
    const rows = await prisma.sys_api_version.findMany({
      where: {
        is_deleted: 0,
        status: { in: ["active", "deprecated", "sunset"] },
      },
      orderBy: { release_at: "asc" },
    });

    cached = rows.map((r) => ({
      code: r.version_code,
      name: r.version_name,
      status: r.status as ApiVersionStatus,
      isDefault: r.is_default === 1,
      releaseAt: r.release_at,
      deprecatedAt: r.deprecated_at,
      sunsetAt: r.sunset_at,
      changelog: r.changelog,
    }));
  } catch (err) {
    logger.error({ err }, "[api-version] load from db failed, fallback to env");
    cached = buildFallbackFromEnv();
  }

  cachedAt = Date.now();
  return cached;
}

/** 找出要挂载的版本（active + deprecated；sunset 也挂，但直接返回 410） */
export function getMountableVersions(all: ApiVersionMeta[]): ApiVersionMeta[] {
  return all.filter(
    (v) =>
      v.status !== "sunset" || v.sunsetAt === null || v.sunsetAt > new Date(),
  );
}

/** 默认版本（Controller 未声明时） */
export function getDefaultVersions(all: ApiVersionMeta[]): string[] {
  const def = all.find((v) => v.isDefault && v.status === "active");
  if (def) return [def.code];
  // 兜底
  return env.API_DEFAULT_VERSIONS.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 缓存失效（管理员改 DB 后调用） */
export function invalidateApiVersionCache(): void {
  cached = null;
  cachedAt = 0;
}

/* ============================================================
 * 环境变量兜底
 * ============================================================ */
function buildFallbackFromEnv(): ApiVersionMeta[] {
  const codes = env.API_DEFAULT_VERSIONS.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return codes.map((code, i) => ({
    code,
    name: `API ${code}`,
    status: "active",
    isDefault: i === 0,
    releaseAt: new Date(),
    deprecatedAt: null,
    sunsetAt: null,
  }));
}
export function loadApiVersionsSync(): ApiVersionMeta[] {
  const codes = env.API_DEFAULT_VERSIONS.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const cachedMap = new Map((cached ?? []).map((v) => [v.code, v]));

  return codes.map((code, i) => {
    const fromCache = cachedMap.get(code);
    if (fromCache) return fromCache;
    return {
      code,
      name: `API ${code}`,
      status: "active",
      isDefault: i === 0,
      releaseAt: new Date(),
      deprecatedAt: null,
      sunsetAt: null,
    };
  });
}
