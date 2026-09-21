import { createHash } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

export interface HttpCacheOptions {
  maxAge?: number;
  scope?: "public" | "private";
  etag?: boolean;
  keyFn?: (req: Request) => string;
}

export function httpCache(opts: HttpCacheOptions = {}) {
  const { maxAge = 60, scope = "private", etag = true, keyFn } = opts;
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();

    const userId = (req as any).user?.userId ?? "anon";
    const tenantId = (req as any).tenantId ?? "anon";
    const directive =
      scope === "public" && userId !== "anon" ? "public" : "private";
    res.setHeader(
      "Cache-Control",
      `${directive}, max-age=${maxAge}${directive === "public" ? ", s-maxage=" + maxAge : ""}`,
    );
    res.setHeader("Vary", "Authorization, Accept-Encoding, X-Tenant-Id");

    if (!etag) return next();

    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      const etagKey = keyFn
        ? keyFn(req)
        : `${req.originalUrl}|${tenantId}|${userId}`;
      const etag = `W/"${createHash("sha1")
        .update(etagKey)
        .update(JSON.stringify(body ?? ""))
        .digest("hex")
        .slice(0, 16)}"`;
      res.setHeader("ETag", etag);
      if (req.headers["if-none-match"] === etag) {
        res.status(304).end();
        return res;
      }
      return originalJson(body);
    };
    next();
  };
}
