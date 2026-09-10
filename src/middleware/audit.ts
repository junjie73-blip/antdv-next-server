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
      const user = (req as any).user;
      const tenantId = (req as any).tenantId || user?.tenantId || null;

      // 如果 tenantId 为 null 或未认证，可跳过写入
      if (!tenantId || !user?.userId) {
        // 或者记录一条匿名日志，但需确保字段可空
        // 这里选择直接返回，避免 Prisma 校验错误
        return;
      }

      await prisma.sys_audit_log.create({
        data: {
          tenant_id: tenantId,
          user_id: user.userId,
          username: user.username || "",
          operation: `${req.method} ${req.route?.path || req.path}`,
          method: req.method,
          request_url: req.originalUrl,
          request_params: JSON.stringify({ query: req.query, body: req.body }),
          ip_address: req.ip || "",
          user_agent: req.headers["user-agent"] || "",
          execute_time: Date.now() - start,
          status: res.statusCode >= 400 ? "0" : "1",
          error_msg: res.statusCode >= 400 ? "Request failed" : null,
        },
      });
    } catch (error) {
      logger.error({ error }, "Failed to write audit log");
    }
  });
  next();
}
