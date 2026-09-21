import rateLimit, {
  ipKeyGenerator,
  type RateLimitRequestHandler,
} from "express-rate-limit";
import { RedisReply, RedisStore } from "rate-limit-redis";
import type { Request, Response, NextFunction } from "express";
import { redis } from "@/config/redis.js";
import { env } from "@/config/env.js";
import { error } from "@/shared/http/response.js";
import { getClientIp } from "@/shared/utils/ip.js";
import { logger } from "@/platform/logger/index.js";

const MAX_BYTES_PER_HOUR =
  Number(env.UPLOAD_MAX_BYTES_PER_HOUR) || 50 * 1024 * 1024 * 1024;
const MAX_PER_SEC = Number(env.UPLOAD_ID_RATE_PER_SEC || 200);
const SKIP_RATE_LIMIT =
  /^\/api\/v1\/(auth|tenant\/options|docs)|^\/(health|metrics|uploads|favicon)/;

export interface LimitRule {
  windowMs: number;
  max: number;
  blockSec: number;
}

export const RULES = {
  normal: { windowMs: 10_000, max: 100, blockSec: 300 },
  chunkUpload: { windowMs: 10_000, max: 500, blockSec: 0 },
  chunkUploadUser: { windowMs: 10_000, max: 2000, blockSec: 0 },
  fileUpload: { windowMs: 60_000, max: 60, blockSec: 0 },
  auth: { windowMs: 60_000, max: 20, blockSec: 600 },
} satisfies Record<string, LimitRule>;

const IP_WHITELIST = new Set(
  (process.env.RATE_LIMIT_WHITELIST || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

const PATH_RULES: Array<{ pattern: RegExp; rule: LimitRule; name: string }> = [
  { pattern: /^\/upload\/chunk\b/, rule: RULES.chunkUpload, name: "chunk" },
  {
    pattern: /^\/upload\/(file|merge)\b/,
    rule: RULES.fileUpload,
    name: "file",
  },
  {
    pattern: /^\/auth\/(login|register|sms|reset)\b/,
    rule: RULES.auth,
    name: "auth",
  },
];

type Scope = "ip" | "user" | "both";

function resolveIdentifier(scope: Scope, req: Request): string {
  const userId = (req as any).user?.userId;
  if ((scope === "user" || scope === "both") && userId) return `user:${userId}`;
  const ip = getClientIp(req) || req.ip || "unknown";
  return `ip-rule:${ipKeyGenerator(ip)}`;
}

function createStore(prefix: string): RedisStore {
  return new RedisStore({
    sendCommand: redis.call.bind(redis) as (
      ...args: string[]
    ) => Promise<RedisReply>,
    prefix: `rate-limit:${prefix}:`,
  });
}

function getBlockDuration(offenseCount: number, baseSec: number): number {
  if (baseSec <= 0) return 0;
  const multipliers = [1, 3, 12, 12];
  const idx = Math.min(offenseCount, multipliers.length - 1);
  return baseSec * multipliers[idx];
}

async function triggerBlock(
  name: string,
  identifier: string,
  baseSec: number,
): Promise<number> {
  if (baseSec <= 0) return 0;

  const offenseKey = `rate-limit:offense:${name}:${identifier}`;
  const blockKey = `rate-limit:block:${name}:${identifier}`;

  const offense = await redis.incr(offenseKey);
  if (offense === 1) {
    await redis.expire(offenseKey, 24 * 3600, "NX").catch(() => {});
  }

  const duration = getBlockDuration(offense - 1, baseSec);
  await redis.setex(blockKey, duration, "1");
  return duration;
}

function blockCheck(scope: Scope, name: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (SKIP_RATE_LIMIT.test(req.path)) return next();
      const ip = getClientIp(req) || "unknown";
      if (IP_WHITELIST.has(ip)) return next();

      const identifier = resolveIdentifier(scope, req);
      const ttl = await redis.ttl(`rate-limit:block:${name}:${identifier}`);
      if (ttl > 0) {
        res.setHeader("Retry-After", String(ttl));
        return error(res, `请求过于频繁，请 ${ttl} 秒后重试`, 403);
      }
      next();
    } catch (e) {
      logger.error({ err: e }, "[ratelimit] block check error");
      next();
    }
  };
}

function createLimiter(
  scope: Scope,
  rule: LimitRule,
  name: string,
): RateLimitRequestHandler {
  return rateLimit({
    windowMs: rule.windowMs,
    max: rule.max,
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore(name),
    keyGenerator: (req) => resolveIdentifier(scope, req),
    skip: (req) => {
      if (SKIP_RATE_LIMIT.test(req.path)) return true;
      const ip = getClientIp(req) || "";
      return IP_WHITELIST.has(ip);
    },
    handler: async (req, res) => {
      const identifier = resolveIdentifier(scope, req);
      let duration = 0;
      if (rule.blockSec > 0) {
        try {
          duration = await triggerBlock(name, identifier, rule.blockSec);
        } catch (e) {
          logger.error({ err: e }, "[ratelimit] trigger block failed");
        }
      }
      logger.warn(
        {
          scope,
          identifier,
          path: req.path,
          max: rule.max,
          windowMs: rule.windowMs,
          duration,
        },
        "[ratelimit] hit",
      );
      if (duration > 0) {
        res.setHeader("Retry-After", String(duration));
        return error(res, `触发流量防护，已封禁 ${duration} 秒`, 403);
      }
      res.setHeader("Retry-After", String(Math.ceil(rule.windowMs / 1000)));
      return error(res, "请求过快，请稍后重试", 429);
    },
  });
}

function createProtectedLimiter(
  scope: Scope,
  rule: LimitRule,
  name: string,
): [ReturnType<typeof blockCheck>, RateLimitRequestHandler] {
  return [blockCheck(scope, name), createLimiter(scope, rule, name)];
}

export const globalRateLimit = createProtectedLimiter(
  "both",
  RULES.normal,
  "global",
);

export const chunkUploadRateLimit = rateLimit({
  windowMs: 10_000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore("chunk"),
  keyGenerator: (req) => resolveIdentifier("both", req),
  handler: (_req, res) => {
    res.setHeader("Retry-After", "10");
    error(res, "上传过快，请稍后重试", 429);
  },
});

export const fileUploadRateLimit = createProtectedLimiter(
  "both",
  RULES.fileUpload,
  "file",
);

export const authRateLimit: [
  ReturnType<typeof blockCheck>,
  RateLimitRequestHandler,
] = [
  blockCheck("both", "auth"),
  rateLimit({
    windowMs: RULES.auth.windowMs,
    max: RULES.auth.max,
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore("auth"),
    skipSuccessfulRequests: true,
    keyGenerator: (req) => resolveIdentifier("both", req),
    handler: async (req, res) => {
      const identifier = resolveIdentifier("both", req);
      let duration = 0;
      try {
        duration = await triggerBlock("auth", identifier, RULES.auth.blockSec);
      } catch (e) {
        logger.error({ err: e }, "[ratelimit] auth block failed");
      }
      logger.warn(
        { identifier, path: req.path, duration },
        "[ratelimit] auth hit",
      );
      res.setHeader("Retry-After", String(duration || 60));
      error(res, `尝试次数过多，请 ${duration || 60} 秒后再试`, 429);
    },
  }),
];

export function autoRateLimit() {
  const cache = new Map<string, RateLimitRequestHandler>();
  const block = blockCheck("both", "auto");
  return async (req: Request, res: Response, next: NextFunction) => {
    await new Promise<void>((resolve, reject) => {
      block(req, res, (err?: any) => (err ? reject(err) : resolve()));
    });
    if (res.headersSent) return;

    const match = PATH_RULES.find(({ pattern }) => pattern.test(req.path));
    const rule = match?.rule ?? RULES.normal;
    const name = match?.name ?? "default";
    if (!cache.has(name)) cache.set(name, createLimiter("both", rule, name));
    cache.get(name)!(req, res, next);
  };
}

export function chunkByteRateLimit() {
  return async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.userId;
      const identifier = userId
        ? `user:${userId}`
        : `ip-rule:${req.ip || "unknown"}`;
      const key = `upload:bytes:${identifier}`;
      const contentLength = Number(req.headers["content-length"] || 0);

      const current = await redis.incrby(key, contentLength);
      if (current === contentLength) {
        await redis.expire(key, 3600, "NX").catch(() => {});
      }

      if (current > MAX_BYTES_PER_HOUR) {
        res.setHeader("Retry-After", "300");
        return error(
          res,
          `本小时上传流量已超限（${MAX_BYTES_PER_HOUR / 1024 / 1024 / 1024}GB），请稍后再试`,
          429,
        );
      }
      next();
    } catch (e) {
      logger.error({ err: e }, "[upload-ratelimit] error, passing through");
      next();
    }
  };
}

const WINDOW_MS = 500;

export async function checkUploadIdRate(
  uploadId: string,
  maxPerSec = MAX_PER_SEC,
): Promise<{ ok: boolean; current: number; limit: number }> {
  try {
    const bucket = Math.floor(Date.now() / WINDOW_MS);
    const key = `upload:rate:${uploadId}:${bucket}`;
    const current = await redis.incr(key);
    if (current === 1) {
      await redis
        .expire(key, Math.ceil((WINDOW_MS * 2) / 1000), "NX")
        .catch(() => {});
    }
    const limit = Math.ceil((maxPerSec * WINDOW_MS) / 1000);
    return { ok: current <= limit, current, limit };
  } catch (e) {
    logger.error({ err: e, uploadId }, "[upload-id-rate] error, allow");
    return { ok: true, current: 0, limit: 0 };
  }
}
