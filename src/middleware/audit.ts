import { Request, Response, NextFunction } from "express";
import { prisma } from "@/config/database.js";
import { logger } from "@/core/logger/index.js";

export async function auditMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const start = Date.now();
  res.on("finish", async () => {
    try {
      const duration = Date.now() - start;
      const user = (req as any).user;
      const tenantId = (req as any).tenantId || user?.tenantId || null;
      const operation = `${req.method} ${req.route?.path || req.path}`;
      const requestParams = JSON.stringify({
        query: req.query,
        params: req.params,
        body: req.body,
      });
      const responseData = res.locals.responseData || null; // 需要在响应前设置

      await prisma.sys_audit_log.create({
        data: {
          tenant_id: tenantId,
          user_id: user?.userId || null,
          username: user?.username || null,
          operation,
          method: req.method,
          request_url: req.originalUrl,
          request_params: requestParams,
          response_data: responseData,
          ip_address: req.ip || req.socket.remoteAddress || "",
          user_agent: req.headers["user-agent"] || "",
          execute_time: duration,
          status: res.statusCode >= 400 ? 0 : 1,
          error_msg:
            res.statusCode >= 400
              ? res.locals.errorMessage || "Request failed"
              : null,
        },
      });
    } catch (error) {
      logger.error({ error }, "Failed to write audit log");
    }
  });
  next();
}
