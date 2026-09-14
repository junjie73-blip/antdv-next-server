import { Request, Response, NextFunction } from "express";
import { pushAudit } from "@/core/audit/queue.js";
import { getClientIp } from "@/common/utils/ip.js";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const SKIP_PATHS = [
  "/api/docs",
  "/api/docs.json",
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
  // 只审计写操作
  if (!WRITE_METHODS.has(req.method) || shouldSkip(req.path)) {
    return next();
  }
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

      // 未认证请求（登录/注册）也可以记，tenant_id 为空则跳过
      if (!tenantId) return;

      pushAudit({
        tenantId,
        userId: user?.userId,
        username: user?.username,
        operation: `${req.method} ${req.route?.path || req.path}`,
        method: req.method,
        requestUrl: req.originalUrl,
        requestParams: { query: req.query, body: req.body },
        ipAddress: getClientIp(req) || "",
        userAgent: req.headers["user-agent"] || "",
        executeTime: Date.now() - start,
        status: res.statusCode >= 400 ? "0" : "1",
        errorMsg: res.statusCode >= 400 ? "Request failed" : undefined,
        responseData: (req as any).__responseBody,
      });
    } catch {
      // 永不阻塞主流程
    }
  });

  next();
}
