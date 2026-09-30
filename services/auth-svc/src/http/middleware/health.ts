import { Router, type Router as ExpressRouter } from "express";
import { prisma } from "../../config/database.js";
import { redis } from "../../config/redis.js";

export const healthRouter: ExpressRouter = Router();

healthRouter.get("/live", (_req, res) => {
  res.json({ status: "ok", service: "auth-svc" });
});

healthRouter.get("/ready", async (_req, res) => {
  const checks: Record<string, { ok: boolean; error?: string }> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { ok: true };
  } catch (e: any) {
    checks.database = { ok: false, error: e?.message };
  }

  try {
    await redis.ping();
    checks.redis = { ok: true };
  } catch (e: any) {
    checks.redis = { ok: false, error: e?.message };
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  res.status(allOk ? 200 : 503).json({
    status: allOk ? "ready" : "not-ready",
    checks,
    timestamp: Date.now(),
  });
});
