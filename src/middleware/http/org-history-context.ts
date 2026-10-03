import type { Request, Response, NextFunction } from "express";
import { getClientIp } from "@/shared/utils/ip.js";
import { getTraceId } from "@/core/context/trace.js";
import { orgHistoryStorage } from "@/modules/org-history/recorder.js";

/**
 * 在每个请求开始时把 operator 上下文写入 AsyncLocalStorage。
 * 挂载位置：requestContext 之后、authMiddleware 之后（需要 user）。
 */
export function orgHistoryContextMiddleware() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;
    const tenantId = req.tenantId;

    // 无 user 或 tenant 的请求（登录、健康检查）跳过
    if (!tenantId) return next();

    orgHistoryStorage.run(
      {
        tenantId,
        operatorId: user?.userId,
        operatorName: user?.username,
        ipAddress: getClientIp(req) ?? undefined,
        traceId: getTraceId(),
        source: "app",
      },
      () => next(),
    );
  };
}
