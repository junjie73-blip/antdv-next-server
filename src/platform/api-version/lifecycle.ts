import type { Response, Request, NextFunction } from "express";
import { loadApiVersions, type ApiVersionMeta } from "./registry.js";

/**
 * 为 deprecated / sunset 版本注入标准响应头。
 * 挂在对应版本 router 的**最前面**。
 */
export function apiVersionLifecycle(versionCode: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const all = await loadApiVersions();
    const meta = all.find((v) => v.code === versionCode);

    if (!meta) return next();

    // 已下线：直接 410
    if (meta.status === "sunset") {
      return res.status(410).json({
        code: 410,
        message: `API ${versionCode} 已停止服务，请迁移至 ${defaultCode(all) ?? "最新版本"}`,
        data: null,
        timestamp: Date.now(),
      });
    }

    // 已废弃：加标准头
    if (meta.status === "deprecated") {
      res.setHeader("Deprecation", "true");
      if (meta.deprecatedAt) {
        res.setHeader("Deprecation-Date", meta.deprecatedAt.toUTCString());
      }
      if (meta.sunsetAt) {
        res.setHeader("Sunset", meta.sunsetAt.toUTCString());
      }
      const next = nextActiveVersion(all, meta.code);
      if (next) {
        res.setHeader("Link", `</api/${next}>; rel="successor-version"`);
      }
    }

    next();
  };
}

function defaultCode(all: ApiVersionMeta[]): string | undefined {
  return all.find((v) => v.isDefault && v.status === "active")?.code;
}

function nextActiveVersion(
  all: ApiVersionMeta[],
  current: string,
): string | undefined {
  const actives = all
    .filter((v) => v.status === "active")
    .map((v) => v.code)
    .sort();
  const idx = actives.indexOf(current);
  if (idx >= 0 && idx < actives.length - 1) return actives[idx + 1];
  return actives[actives.length - 1];
}
