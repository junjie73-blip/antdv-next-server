import type { Request, Response, NextFunction } from "express";

/**
 * 从 URL 提取版本号，注入 req.apiVersion。
 * 挂在全局（在 requestContext 之后、authMiddleware 之前）。
 */
export function apiVersionContext() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const m = /^\/api\/(v\d+)(?:\/|$)/.exec(req.path);
    if (m) {
      (req as any).apiVersion = m[1];
    }
    next();
  };
}
