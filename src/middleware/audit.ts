import { Request, Response, NextFunction } from "express";
import { prisma } from "@/config/database.js";

/**
 * 审计日志中间件
 * 自动记录系统操作日志
 */
export function auditMiddleware(operation: string) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const startTime = Date.now();
    const originalJson = res.json.bind(res);

    res.json = function (body: any): Response {
      const executeTime = Date.now() - startTime;

      // 异步记录日志，不阻塞响应
      prisma.sys_audit_log
        .create({
          data: {
            tenant_id:
              req.tenantId ||
              req.user?.tenantId ||
              "00000000-0000-0000-0000-000000000000",
            user_id: req.user?.userId || null,
            username: req.user?.username || null,
            operation,
            method: req.method,
            request_url: req.originalUrl,
            request_params: JSON.stringify({
              body: req.body,
              query: req.query,
              params: req.params,
            }),
            response_data: JSON.stringify(body).substring(0, 10000),
            ip_address: req.ip || req.socket.remoteAddress || "",
            user_agent: req.headers["user-agent"] || "",
            execute_time: executeTime,
            status: body && body.code === 200 ? 1 : 0,
            error_msg: body && body.code !== 200 ? body.message : null,
          },
        })
        .catch((err) => console.error("Audit log error:", err));

      return originalJson(body);
    };

    next();
  };
}
