import { Request, Response, NextFunction } from "express";
import { pushAudit } from "@/platform/audit/index.js";
import { getClientIp } from "@/shared/utils/ip.js";
import { summarizeRequest, summarizeResponse } from "@/platform/audit/index.js";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const SKIP_PATHS = [
  "/api/docs",
  "/api/docs.json",
  "/api/v1/upload/chunk", // ⭐ 分片上传不进审计
  "/uploads/",
  "/health",
  "/favicon.ico",
];

function shouldSkip(path: string): boolean {
  return SKIP_PATHS.some((p) =>
    p.endsWith("/")
      ? path.startsWith(p)
      : path === p || path.startsWith(`${p}/`),
  );
}

export function auditMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!WRITE_METHODS.has(req.method) || shouldSkip(req.path)) return next();

  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    try {
      (req as any).__responseBody = body;
    } catch {}
    return originalJson(body);
  };

  const start = Date.now();
  res.on("finish", () => {
    try {
      const user = (req as any).user;
      const tenantId = (req as any).tenantId || user?.tenantId || null;
      if (!tenantId) return;

      pushAudit({
        tenantId,
        userId: user?.userId ?? null,
        username: user?.username ?? null,
        operation: `${req.method} ${req.route?.path || req.path}`,
        method: req.method,
        requestUrl: req.originalUrl.split("?")[0],
        requestParams: summarizeRequest({
          query: req.query,
          body: req.body,
          contentType: (req.headers["content-type"] as string) ?? "",
        }),
        ipAddress: getClientIp(req) || "",
        userAgent: ((req.headers["user-agent"] as string) || "").slice(0, 512),
        executeTime: Date.now() - start,
        status: res.statusCode >= 400 ? "0" : "1",
        errorMsg:
          res.statusCode >= 400
            ? String((req as any).__errorMsg ?? "").slice(0, 200)
            : null,
        responseData: summarizeResponse((req as any).__responseBody),
      });
    } catch {
      // 永不阻塞主流程
    }
  });

  next();
}
