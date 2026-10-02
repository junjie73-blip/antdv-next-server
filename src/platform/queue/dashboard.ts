import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { env } from "@/config/env.js";
import { logger } from "@/platform/logger/index.js";
import { Router, Request, Response, NextFunction } from "express";
import { queueList } from "./queues.js";

let cachedRouter: Router | null = null;

export function buildQueueDashboardRouter(): Router | null {
  if (cachedRouter) return cachedRouter;
  if (env.ENABLE_QUEUE_DASHBOARD !== "0") return null;

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");

  createBullBoard({
    queues: queueList.map((q) => new BullMQAdapter(q)),
    serverAdapter,
  });

  const router = Router();

  // 鉴权中间件：需要 system:queue:manage 权限
  router.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user?.userId) {
        return res.status(401).json({ code: 401001, message: "未认证" });
      }
      const { checkPermission } = await import("@/modules/rbac/index.js");
      const ok = await checkPermission(
        user.userId,
        user.tenantId,
        "system:queue:manage",
      );
      if (!ok) {
        return res.status(403).json({ code: 403001, message: "无权限" });
      }
      next();
    } catch (err) {
      logger.warn({ err }, "[queue-dashboard] auth failed");
      res.status(500).end();
    }
  });

  router.use(serverAdapter.getRouter());
  cachedRouter = router;
  logger.info("[queue-dashboard] mounted at /admin/queues");
  return router;
}
