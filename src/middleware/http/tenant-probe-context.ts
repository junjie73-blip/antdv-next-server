import type { Request, Response, NextFunction } from "express";
import { tenantProbeStorage } from "@/modules/system/tenant-isolation/scanners/runtime.js";

/**
 * 写入运行时探针上下文。
 * 必须在 authMiddleware / tenantResolver 之后挂载。
 */
export function tenantProbeContext() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const tenantId = req.tenantId ?? req.user?.tenantId;
    if (!tenantId) return next();

    tenantProbeStorage.run(
      {
        tenantId,
        repoName: undefined,
        method: req.method,
      },
      () => next(),
    );
  };
}
